/**
 * ML Prompt Templates Setup Script
 *
 * This script adds predefined ML prompt templates to sample-data.ts
 * These templates are curated examples for text-to-CAD generation.
 *
 * Usage:
 *   Run: npx tsx scripts/fetch-ml-prompts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// MLPromptTemplate interface matching the design document
interface MLPromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category?: string;
  tags?: string[];
  example_output?: string;
}

// Predefined templates for text-to-CAD generation
function getTemplates(): MLPromptTemplate[] {
  return [
    {
      id: 'template-1',
      title: 'I-Beam',
      description: 'Standard structural I-beam with specified dimensions',
      prompt: 'I-beam, 12 in long, 4 in high, 2.66 x 0.29 in flange, 0.19 in web, 0.46 in root radius',
      category: 'structural',
      tags: ['beam', 'structural', 'i-beam', 'steel']
    },
    {
      id: 'template-2',
      title: 'Drill Guide',
      description: 'Surgical drill guide with multiple bit sizes and rotating grips',
      prompt: 'Surgical drill guide, 150 mm handle, Ø2 & Ø3.2 mm bits, twin bit mounts with rotating grips',
      category: 'medical',
      tags: ['surgical', 'drill', 'guide', 'medical', 'precision']
    },
    {
      id: 'template-3',
      title: 'Gallows Frame',
      description: 'Large structural frame with brackets and angle iron construction',
      prompt: 'Gallows frame, 2400x1250x450 mm, 6 brackets, angle iron',
      category: 'structural',
      tags: ['frame', 'structural', 'brackets', 'angle-iron', 'large-scale']
    },
    {
      id: 'template-4',
      title: 'Brake Rotor',
      description: 'Vented automotive brake rotor with bolt pattern',
      prompt: 'A 320mm vented brake rotor with 5 M12 holes on 114.3mm PCD',
      category: 'automotive',
      tags: ['brake', 'rotor', 'automotive', 'vented', 'disc']
    }
  ];
}

// Write templates to sample-data.ts
async function writeTemplatesToFile(templates: MLPromptTemplate[]): Promise<void> {
  console.log('📝 Writing templates to src/data/sample-data.ts...\n');

  try {
    const sampleDataPath = path.join(process.cwd(), 'src/data/sample-data.ts');

    // Read existing file
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error('sample-data.ts not found at src/data/sample-data.ts');
    }

    const existingContent = fs.readFileSync(sampleDataPath, 'utf-8');

    // Check if mlPromptTemplates already exists
    if (existingContent.includes('export const mlPromptTemplates')) {
      console.warn('⚠️  mlPromptTemplates already exists in sample-data.ts');
      console.warn('   The existing data will be replaced with new templates\n');
      
      // Remove existing mlPromptTemplates export
      const regex = /\/\/ ML Prompt Templates[\s\S]*?export const mlPromptTemplates[\s\S]*?(?=\n\/\/|\nexport|$)/;
      const updatedContent = existingContent.replace(regex, '');
      fs.writeFileSync(sampleDataPath, updatedContent, 'utf-8');
    }

    // Format templates as TypeScript code
    const templateCode = `
// ML Prompt Templates
// Predefined templates for text-to-CAD generation
// Last updated: ${new Date().toISOString()}

export interface MLPromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category?: string;
  tags?: string[];
  example_output?: string;
}

export const mlPromptTemplates: MLPromptTemplate[] = ${JSON.stringify(templates, null, 2)};
`;

    // Append to file
    fs.appendFileSync(sampleDataPath, templateCode, 'utf-8');

    console.log('✅ Successfully wrote templates to sample-data.ts');
    console.log(`   Added ${templates.length} templates\n`);

  } catch (error: any) {
    if (error.code === 'EACCES') {
      console.error('❌ Permission denied writing to sample-data.ts');
      console.error('   Check file permissions');
    } else if (error.code === 'ENOENT') {
      console.error('❌ File not found:', error.path);
    } else {
      console.error('❌ Failed to write templates:', error.message);
    }
    
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting ML Prompt Templates setup...\n');

  try {
    // Get predefined templates
    const templates = getTemplates();

    // Display summary of templates
    console.log('📊 Templates Summary:');
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.title}`);
      console.log(`      Category: ${template.category || 'N/A'}`);
      console.log(`      Prompt: ${template.prompt.substring(0, 60)}...`);
    });
    console.log('');

    // Write to file
    await writeTemplatesToFile(templates);

    console.log('✨ ML Prompt Templates setup completed successfully!');
    console.log('   Templates are now available in src/data/sample-data.ts');
    console.log('   You can now use them in your CAD Generator component\n');

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
