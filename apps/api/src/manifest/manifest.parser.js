
import fs from 'fs/promises';
import path from 'path';

export class ManifestParser {
  /**
   * Loads and parses a manifest file from the filesystem
   */
  static async loadManifest(manifestPath) {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      return this.parseManifestContent(content);
    } catch (error) {
      throw new Error(`Failed to load manifest from ${manifestPath}: ${error.message}`);
    }
  }

  /**
   * Parses manifest content (handles both JSON and TS/JS exports)
   */
  static parseManifestContent(content) {
    try {
      // Try parsing as pure JSON first
      return JSON.parse(content);
    } catch (e) {
      // If not JSON, attempt to parse as JS/TS module
      return this._parseJavaScriptModule(content);
    }
  }

  /**
   * Loads a manifest from an npm package directory
   */
  static async loadFromPackage(packagePath) {
    const manifestPath = path.join(packagePath, 'manifest.ts');
    const jsManifestPath = path.join(packagePath, 'manifest.js');
    const jsonManifestPath = path.join(packagePath, 'manifest.json');

    for (const p of [jsonManifestPath, manifestPath, jsManifestPath]) {
      try {
        await fs.access(p);
        return await this.loadManifest(p);
      } catch (e) {
        // Continue to next file
      }
    }
    throw new Error(`No manifest found in package ${packagePath}`);
  }

  /**
   * Parses manifest from a buffer
   */
  static parseFromBuffer(fileBuffer) {
    return this.parseManifestContent(fileBuffer.toString('utf-8'));
  }

  /**
   * Internal helper to extract the default export from a JS/TS file string
   */
  static _parseJavaScriptModule(content) {
    try {
      // 1. Remove imports
      let cleanCode = content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
      
      // 2. Remove defineIntegration wrapper if present
      cleanCode = cleanCode.replace(/defineIntegration\s*\(/g, '(');
      
      // 3. Replace export default with return
      cleanCode = cleanCode.replace(/export\s+default\s+/g, 'return ');
      
      // 4. Remove basic TS type annotations (naive approach for simple manifests)
      cleanCode = cleanCode.replace(/:\s*[A-Z][a-zA-Z0-9_]*(\[\])?\s*(?=[,}])/g, '');
      cleanCode = cleanCode.replace(/as\s+const/g, '');
      
      // Evaluate the cleaned code to get the object safely
      const fn = new Function(cleanCode);
      return fn();
    } catch (error) {
      throw new Error(`Failed to parse JS/TS manifest: ${error.message}`);
    }
  }
}
