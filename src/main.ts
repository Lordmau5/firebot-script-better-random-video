import { Firebot, ScriptModules } from '@crowbartools/firebot-custom-scripts-types';
import { autoload } from './autoload';
import { EventSource } from '@crowbartools/firebot-custom-scripts-types/types/modules/event-manager';
import { FirebotSettings } from '@crowbartools/firebot-custom-scripts-types/types/settings';
import { createVideoManager } from './video-manager';

const script: Firebot.CustomScript = {
  getScriptManifest: () => {
    return {
      name: 'Better Random Video',
      description: 'A custom script that plays a random video from a folder without repeating',
      author: 'Lordmau5',
      version: '1.0',
      firebotVersion: '5',
    };
  },
  getDefaultParameters: () => {
    return {};
  },
  run: async (runRequest) => {
    const eventSource: EventSource = {
      id: 'better-random-video',
      name: 'Better Random Video',
      events: []
    };
    autoload(runRequest.modules, eventSource);
    modules = runRequest.modules;
    settings = runRequest.firebot.settings;

    try {
      createVideoManager(modules.path.join(SCRIPTS_DIR, '..', 'db', 'betterVideosDB.db'), modules);
    } catch (error) {
      debugger;
    }
  }
};

export let modules: ScriptModules;

export let settings: FirebotSettings;

export default script;
