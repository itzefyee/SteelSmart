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
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;

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

    // Create renderer (offscreen)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // Required for toDataURL
    });
    this.renderer.setSize(width, height);

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
  }

  /**
   * Generate view from specific angle
   */
  private generateView(
    name: string,
    cameraPosition: THREE.Vector3,
    cameraUp: THREE.Vector3
  ): GeneratedView {
    // Position camera
    this.camera.position.copy(cameraPosition);
    this.camera.up.copy(cameraUp);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // Render
    this.renderer.render(this.scene, this.camera);

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
  generateAllViews(): GeneratedView[] {
    const views: GeneratedView[] = [];
    const distance = 20; // Camera distance from origin

    // Top view (looking down -Y axis)
    views.push(
      this.generateView(
        'top',
        new THREE.Vector3(0, distance, 0),
        new THREE.Vector3(0, 0, -1)
      )
    );

    // Bottom view (looking up +Y axis)
    views.push(
      this.generateView(
        'bottom',
        new THREE.Vector3(0, -distance, 0),
        new THREE.Vector3(0, 0, 1)
      )
    );

    // Front view (looking from +Z axis)
    views.push(
      this.generateView(
        'front',
        new THREE.Vector3(0, 0, distance),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Back view (looking from -Z axis)
    views.push(
      this.generateView(
        'back',
        new THREE.Vector3(0, 0, -distance),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Right view (looking from +X axis)
    views.push(
      this.generateView(
        'right',
        new THREE.Vector3(distance, 0, 0),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Left view (looking from -X axis)
    views.push(
      this.generateView(
        'left',
        new THREE.Vector3(-distance, 0, 0),
        new THREE.Vector3(0, 1, 0)
      )
    );

    return views;
  }

  /**
   * Generate specific views (e.g., only top, front, right)
   */
  generateViews(viewNames: string[]): GeneratedView[] {
    const allViews = this.generateAllViews();
    return allViews.filter((view) => viewNames.includes(view.name));
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    this.renderer.dispose();
  }
}
