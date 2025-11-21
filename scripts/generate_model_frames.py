#!/usr/bin/env python3
"""
Generate 360-degree rotating frames from a STEP file for web display.
Requires: Blender (with Python API), or FreeCAD

Usage:
    python generate_model_frames.py --input path/to/model.step --output frames_dir --frames 36
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def check_blender_installed():
    """Check if Blender is installed and accessible."""
    try:
        result = subprocess.run(['blender', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def generate_blender_script(step_file, output_dir, num_frames, image_size=1024):
    """Generate a Python script that Blender will execute."""
    script = f"""
import bpy
import math
import os

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import STEP file
bpy.ops.import_mesh.stl(filepath=r"{step_file}")

# Get the imported object
obj = bpy.context.selected_objects[0]
bpy.context.view_layer.objects.active = obj

# Center the object
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
obj.location = (0, 0, 0)

# Scale to reasonable size
max_dimension = max(obj.dimensions)
scale_factor = 2.0 / max_dimension
obj.scale = (scale_factor, scale_factor, scale_factor)

# Set up material (metallic look)
mat = bpy.data.materials.new(name="MetalMaterial")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs['Metallic'].default_value = 0.8
bsdf.inputs['Roughness'].default_value = 0.2
bsdf.inputs['Base Color'].default_value = (0.3, 0.5, 0.7, 1.0)  # Blueish color

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

# Set up camera
cam_data = bpy.data.cameras.new("Camera")
cam = bpy.data.objects.new("Camera", cam_data)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

# Position camera
cam.location = (4, 0, 2)
cam.rotation_euler = (math.radians(70), 0, math.radians(90))

# Set up lighting (3-point lighting)
# Key light
key_light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
key_light_data.energy = 2.0
key_light = bpy.data.objects.new("KeyLight", key_light_data)
bpy.context.scene.collection.objects.link(key_light)
key_light.location = (5, -5, 8)
key_light.rotation_euler = (math.radians(45), 0, math.radians(45))

# Fill light
fill_light_data = bpy.data.lights.new(name="FillLight", type='SUN')
fill_light_data.energy = 0.5
fill_light = bpy.data.objects.new("FillLight", fill_light_data)
bpy.context.scene.collection.objects.link(fill_light)
fill_light.location = (-5, -5, 5)

# Back light
back_light_data = bpy.data.lights.new(name="BackLight", type='SUN')
back_light_data.energy = 1.0
back_light = bpy.data.objects.new("BackLight", back_light_data)
bpy.context.scene.collection.objects.link(back_light)
back_light.location = (0, 5, 3)

# Set up render settings
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.render.resolution_x = {image_size}
scene.render.resolution_y = {image_size}
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

# Create output directory
output_dir = r"{output_dir}"
os.makedirs(output_dir, exist_ok=True)

# Generate frames
num_frames = {num_frames}
for i in range(num_frames):
    # Rotate object
    angle = (2 * math.pi * i) / num_frames
    obj.rotation_euler = (0, 0, angle)
    
    # Render
    frame_name = f"brake-rotor-{{i:03d}}.png"
    scene.render.filepath = os.path.join(output_dir, frame_name)
    bpy.ops.render.render(write_still=True)
    
    print(f"Rendered frame {{i+1}}/{{num_frames}}")

print("All frames generated successfully!")
"""
    return script

def generate_freecad_script(step_file, output_dir, num_frames):
    """Generate a Python script that FreeCAD will execute."""
    script = f"""
import FreeCAD
import FreeCADGui
import Part
import math
import os
from PySide import QtGui

# Create output directory
output_dir = r"{output_dir}"
os.makedirs(output_dir, exist_ok=True)

# Import STEP file
doc = FreeCAD.newDocument("Render")
Part.insert(r"{step_file}", "Render")

# Get the imported object
obj = doc.Objects[0]

# Setup view
FreeCADGui.showMainWindow()
FreeCADGui.ActiveDocument = FreeCADGui.getDocument("Render")
view = FreeCADGui.ActiveDocument.ActiveView

# Set camera position
view.viewIsometric()
view.fitAll()

# Generate frames
num_frames = {num_frames}
for i in range(num_frames):
    angle = 360.0 * i / num_frames
    view.setCameraOrientation(
        FreeCAD.Rotation(FreeCAD.Vector(0, 0, 1), angle)
    )
    
    frame_name = f"brake-rotor-{{i:03d}}.png"
    filepath = os.path.join(output_dir, frame_name)
    view.saveImage(filepath, 1024, 1024, "White")
    
    print(f"Rendered frame {{i+1}}/{{num_frames}}")

print("All frames generated successfully!")
FreeCAD.closeDocument("Render")
"""
    return script

def main():
    parser = argparse.ArgumentParser(
        description='Generate rotating frames from a STEP file'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Path to input STEP file'
    )
    parser.add_argument(
        '--output',
        required=True,
        help='Output directory for frames'
    )
    parser.add_argument(
        '--frames',
        type=int,
        default=36,
        help='Number of frames to generate (default: 36)'
    )
    parser.add_argument(
        '--size',
        type=int,
        default=1024,
        help='Image size in pixels (default: 1024)'
    )
    parser.add_argument(
        '--use-freecad',
        action='store_true',
        help='Use FreeCAD instead of Blender'
    )
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found!")
        sys.exit(1)
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    if args.use_freecad:
        print("Using FreeCAD for rendering...")
        script = generate_freecad_script(args.input, args.output, args.frames)
        script_path = os.path.join(args.output, "render_script.py")
        
        with open(script_path, 'w') as f:
            f.write(script)
        
        print(f"Generated FreeCAD script at: {script_path}")
        print("Run: freecadcmd " + script_path)
        
    else:
        if not check_blender_installed():
            print("Error: Blender not found!")
            print("Please install Blender or use --use-freecad option")
            print("\nInstallation:")
            print("  - Download from: https://www.blender.org/download/")
            print("  - Or use: winget install BlenderFoundation.Blender")
            sys.exit(1)
        
        print(f"Using Blender for rendering...")
        print(f"Generating {args.frames} frames at {args.size}x{args.size}px...")
        
        # First, convert STEP to STL (Blender doesn't support STEP directly)
        stl_path = os.path.join(args.output, "temp_model.stl")
        print(f"\nNote: You need to convert STEP to STL first.")
        print(f"Recommended: Use FreeCAD or online converter")
        print(f"FreeCAD command: freecadcmd -c 'import Part; Part.insert(\"{args.input}\").exportStl(\"{stl_path}\")'")
        
        script = generate_blender_script(stl_path, args.output, args.frames, args.size)
        script_path = os.path.join(args.output, "render_script.py")
        
        with open(script_path, 'w') as f:
            f.write(script)
        
        print(f"\nGenerated Blender script at: {script_path}")
        print(f"\nTo render, run:")
        print(f"  blender --background --python {script_path}")

if __name__ == '__main__':
    main()









