import * as THREE from 'three';
import { CADModelData } from './cad-parser';

export interface ViewOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGrid?: boolean;
  showAxes?: boolean;
}

export interface GeneratedView {
  name: string;
  dataUrl: string; // base64 PNG
  blob: Blob;
}

export class CADViewGenerator {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private perspectiveCamera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;
  private wireframe: THREE.LineSegments | null = null;
  private perspectiveDistance = 20;
  private boundingSphereRadius = 1;
  private isContextLost = false;

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.isContextLost = true;
  };

  private handleContextRestored = (): void => {
    this.renderer.resetState();
    this.isContextLost = false;
  };

  constructor(private options: ViewOptions = {}) {
    const width = options.width || 800;
    const height = options.height || 600;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      options.backgroundColor || '#ffffff'
    );

    // Create orthographic camera
    const aspect = width / height;
    const frustumSize = 10;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    this.perspectiveCamera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      5000
    );
    this.perspectiveCamera.position.set(10, 10, 10);
    this.perspectiveCamera.lookAt(0, 0, 0);

    // Create renderer (offscreen)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // Required for toDataURL
    });
    this.renderer.setSize(width, height);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Optional: Add grid
    if (options.showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20);
      this.scene.add(gridHelper);
    }

    // Optional: Add axes
    if (options.showAxes) {
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
    }
  }

  /**
   * Load CAD model data into the scene
   */
  loadModel(modelData: CADModelData): void {
    // Remove existing mesh
    if (this.mesh) {
      if (this.wireframe) {
        this.mesh.remove(this.wireframe);
        this.wireframe.geometry.dispose();
        if (Array.isArray(this.wireframe.material)) {
          this.wireframe.material.forEach((m) => m.dispose());
        } else {
          this.wireframe.material.dispose();
        }
        this.wireframe = null;
      }

      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }

    // Create geometry from CAD data
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(modelData.vertices, 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(modelData.normals, 3)
    );
    geometry.setIndex(new THREE.BufferAttribute(modelData.indices, 1));

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });
    this.wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.wireframe.visible = false;
    this.mesh.add(this.wireframe);

    // Center and fit model
    this.fitCameraToModel();
  }

  /**
   * Fit camera to show entire model
   */
  private fitCameraToModel(): void {
    if (!this.mesh) return;

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(this.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center model
    this.mesh.position.sub(center);

    // Adjust camera frustum to fit model
    const maxDim = Math.max(size.x, size.y, size.z);
    const aspect = this.renderer.domElement.width / this.renderer.domElement.height;

    this.camera.left = (-maxDim * aspect) / 2;
    this.camera.right = (maxDim * aspect) / 2;
    this.camera.top = maxDim / 2;
    this.camera.bottom = -maxDim / 2;
    this.camera.updateProjectionMatrix();

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    this.boundingSphereRadius = sphere.radius || Math.max(maxDim, 1);

    const verticalFov = THREE.MathUtils.degToRad(this.perspectiveCamera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const distanceFromVertical = this.boundingSphereRadius / Math.sin(Math.max(verticalFov / 2, 0.001));
    const distanceFromHorizontal = this.boundingSphereRadius / Math.sin(Math.max(horizontalFov / 2, 0.001));
    const targetDistance = Math.max(distanceFromVertical, distanceFromHorizontal);

    this.perspectiveDistance = Math.max(targetDistance * 1.005, this.boundingSphereRadius * 1.02, 2);
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.near = Math.max(0.1, this.perspectiveDistance - this.boundingSphereRadius * 3);
    this.perspectiveCamera.far = this.perspectiveDistance + this.boundingSphereRadius * 3;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  /**
   * Generate view from specific angle
   */
  private generateView(
    name: string,
    cameraPosition: THREE.Vector3,
    cameraUp: THREE.Vector3
  ): GeneratedView {
    this.camera.position.copy(cameraPosition);
    this.camera.up.copy(cameraUp);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    return this.renderCamera(name, this.camera);
  }

  private generatePerspectiveView(
    name: string,
    direction: THREE.Vector3,
    up: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
  ): GeneratedView {
    const camera = this.perspectiveCamera;
    const radius = Math.max(this.boundingSphereRadius, 1);
    const distance = Math.max(this.perspectiveDistance, radius * 1.02, 2);
    const position = direction.clone().normalize().multiplyScalar(distance);
    camera.position.copy(position);
    camera.up.copy(up);
    camera.near = Math.max(0.1, distance - radius * 3);
    camera.far = distance + radius * 3;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return this.renderCamera(name, camera);
  }

  private renderCamera(name: string, camera: THREE.Camera): GeneratedView {
    if (this.isContextLost) {
      throw new Error('WebGL context is unavailable. Please try generating views again.');
    }

    this.renderer.render(this.scene, camera);

    // Get image data
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Convert to blob
    const base64Data = dataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return { name, dataUrl, blob };
  }

  /**
   * Generate all standard orthographic views
   */
  generateAllViews(viewNames?: readonly string[]): GeneratedView[] {
    const distance = 20; // Camera distance from origin
    const definitions = [
      { name: 'top', position: new THREE.Vector3(0, distance, 0), up: new THREE.Vector3(0, 0, -1) },
      { name: 'bottom', position: new THREE.Vector3(0, -distance, 0), up: new THREE.Vector3(0, 0, 1) },
      { name: 'front', position: new THREE.Vector3(0, 0, distance), up: new THREE.Vector3(0, 1, 0) },
      { name: 'back', position: new THREE.Vector3(0, 0, -distance), up: new THREE.Vector3(0, 1, 0) },
      { name: 'right', position: new THREE.Vector3(distance, 0, 0), up: new THREE.Vector3(0, 1, 0) },
      { name: 'left', position: new THREE.Vector3(-distance, 0, 0), up: new THREE.Vector3(0, 1, 0) },
    ];

    return definitions
      .filter(({ name }) => !viewNames || viewNames.includes(name))
      .map(({ name, position, up }) => this.generateView(name, position, up));
  }

  /**
   * Generate perspective/isometric views
   */
  generatePerspectiveViews(limit?: number): GeneratedView[] {
    const views: GeneratedView[] = [];
    const meshMaterial = this.mesh?.material as THREE.MeshStandardMaterial;
    const wireframeMaterial = this.wireframe?.material as THREE.LineBasicMaterial;
    const originalMeshColor = meshMaterial ? meshMaterial.color.clone() : null;
    const originalWireframeColor = wireframeMaterial ? wireframeMaterial.color.clone() : null;
    const originalWireframeVisible = this.wireframe?.visible ?? false;

    if (meshMaterial) {
      meshMaterial.color.set('#999999');
    }
    if (this.wireframe && wireframeMaterial) {
      this.wireframe.visible = true;
      wireframeMaterial.color.set('#000000');
    }

    const directions = [
      { name: 'iso-front-top-right', vector: new THREE.Vector3(1, 1, 1) },
      { name: 'iso-front-top-left', vector: new THREE.Vector3(-1, 1, 1) },
      { name: 'iso-front-bottom-right', vector: new THREE.Vector3(1, -1, 1) },
      { name: 'iso-front-bottom-left', vector: new THREE.Vector3(-1, -1, 1) },
      { name: 'iso-back-top-right', vector: new THREE.Vector3(1, 1, -1) },
      { name: 'iso-back-bottom-left', vector: new THREE.Vector3(-1, -1, -1) },
    ];

    directions.slice(0, limit).forEach(({ name, vector }) => {
      const upVector =
        Math.abs(vector.y) > 0.95
          ? new THREE.Vector3(0, 0, vector.y > 0 ? 1 : -1)
          : new THREE.Vector3(0, 1, 0);
      views.push(this.generatePerspectiveView(name, vector, upVector));
    });

    if (meshMaterial && originalMeshColor) {
      meshMaterial.color.copy(originalMeshColor);
    }
    if (this.wireframe && wireframeMaterial && originalWireframeColor) {
      wireframeMaterial.color.copy(originalWireframeColor);
      this.wireframe.visible = originalWireframeVisible;
    }

    return views;
  }

  /**
   * Generate specific views (e.g., only top, front, right)
   */
  generateViews(viewNames: string[]): GeneratedView[] {
    return this.generateAllViews(viewNames);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    if (this.wireframe) {
      this.wireframe.geometry.dispose();
      if (Array.isArray(this.wireframe.material)) {
        this.wireframe.material.forEach((m) => m.dispose());
      } else {
        this.wireframe.material.dispose();
      }
    }
    this.renderer.dispose();
  }
}
