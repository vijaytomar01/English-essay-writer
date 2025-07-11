'use client';

import { useState } from 'react';
import { Save, RotateCcw, Clock, FileText, Space, ToggleLeft, ToggleRight, Delete } from 'lucide-react';

interface SettingsPanelProps {
  settings: {
    timeLimit: number;
    wordLimit: number;
    spacingAfterWords: number;
    autoSave: boolean;
    backspaceLimit: number;
  };
  setSettings: (settings: any) => void;
}

export default function SettingsPanel({ settings, setSettings }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const saveSettings = () => {
    setSettings(localSettings);
    setHasChanges(false);
    localStorage.setItem('essay-writer-settings', JSON.stringify(localSettings));
  };

  const resetSettings = () => {
    const defaultSettings = {
      timeLimit: 30,
      wordLimit: 500,
      spacingAfterWords: 1,
      autoSave: true,
      backspaceLimit: 10,
    };
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const loadSavedSettings = () => {
    const saved = localStorage.getItem('essay-writer-settings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      setLocalSettings(parsedSettings);
      setSettings(parsedSettings);
      setHasChanges(false);
    }
  };

  // Predefined time limits in minutes
  const timeLimits = [5, 10, 15, 20, 30, 45, 60, 90, 120];
  
  // Predefined word limits
  const wordLimits = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000];

  // Predefined backspace limits
  const backspaceLimits = [0, 5, 10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Unsaved changes
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Limit Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Time Limit</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Writing Time Limit (minutes)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeLimits.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => handleSettingChange('timeLimit', limit)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      localSettings.timeLimit === limit
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                    }`}
                  >
                    {limit}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={localSettings.timeLimit}
                onChange={(e) => handleSettingChange('timeLimit', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Word Limit Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Word Limit</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Word Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {wordLimits.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => handleSettingChange('wordLimit', limit)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      localSettings.wordLimit === limit
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                    }`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Word Limit
              </label>
              <input
                type="number"
                min="50"
                max="10000"
                value={localSettings.wordLimit}
                onChange={(e) => handleSettingChange('wordLimit', parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Backspace Limit Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Delete className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Backspace Limit</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Character Deletion Limit
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Maximum number of characters that can be deleted. Essay auto-submits when exceeded. Set to 0 for no deletions allowed.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {backspaceLimits.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => handleSettingChange('backspaceLimit', limit)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      localSettings.backspaceLimit === limit
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                    }`}
                  >
                    {limit === 0 ? 'None' : limit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Backspace Limit
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.backspaceLimit}
                onChange={(e) => handleSettingChange('backspaceLimit', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Spacing Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Space className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Text Spacing</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spaces After Words
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={localSettings.spacingAfterWords}
                  onChange={(e) => handleSettingChange('spacingAfterWords', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                  {localSettings.spacingAfterWords}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Preview: "word{' '.repeat(localSettings.spacingAfterWords)}word{' '.repeat(localSettings.spacingAfterWords)}word"
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Save Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Save className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Auto-Save</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Auto-Save
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically save your work every 2 seconds
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('autoSave', !localSettings.autoSave)}
                className={`flex items-center transition-colors ${
                  localSettings.autoSave ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {localSettings.autoSave ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Preview */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Current Settings Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Time Limit:</span>
            <br />
            {localSettings.timeLimit} minutes
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Word Limit:</span>
            <br />
            {localSettings.wordLimit} words
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Backspace Limit:</span>
            <br />
            {localSettings.backspaceLimit === 0 ? 'None' : `${localSettings.backspaceLimit} chars`}
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Spacing:</span>
            <br />
            {localSettings.spacingAfterWords} space{localSettings.spacingAfterWords > 1 ? 's' : ''}
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Auto-Save:</span>
            <br />
            {localSettings.autoSave ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Load Saved Settings */}
      <div className="mt-4 text-center">
        <button
          onClick={loadSavedSettings}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Load Previously Saved Settings
        </button>
      </div>
    </div>
  );
}
