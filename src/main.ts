import { Firebot, ScriptModules } from '@crowbartools/firebot-custom-scripts-types';
import { EventSource } from '@crowbartools/firebot-custom-scripts-types/types/modules/event-manager';
import { FirebotSettings } from '@crowbartools/firebot-custom-scripts-types/types/settings';
import { autoload } from './autoload';
import { createVideoManager } from './video-manager';

const script: Firebot.CustomScript = {
  getScriptManifest: () => {
    return {
      name: 'Play Video++',
      description: 'A custom script that enhances the \'Play Video\' effect with proper folder randomness and effect output support',
      author: 'Lordmau5',
      version: '1.0.3',
      firebotVersion: '5',
    };
  },
  getDefaultParameters: () => {
    return {};
  },
  run: async (runRequest) => {
    const eventSource: EventSource = {
      id: 'play-video-plus-plus',
      name: 'Play Video++',
      events: []
    };
    autoload(runRequest.modules, eventSource);
    modules = runRequest.modules;
    settings = runRequest.firebot.settings;

    try {
      createVideoManager(modules.path.join(SCRIPTS_DIR, '..', 'db', 'playVideoPlusPlus.db'), modules);
    } catch (error) {
      debugger;
    }
  }
};

export let modules: ScriptModules;

export let settings: FirebotSettings;

export default script;
