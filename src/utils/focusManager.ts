/**
 * Focus mode detection and management
 */
export class FocusManager {
  private static instance: FocusManager;
  private isFocusMode = false;
  private listeners: ((isFocusMode: boolean) => void)[] = [];
  
  /**
   * Gets singleton instance of FocusManager
   */
  public static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }
  
  /**
   * Private constructor to force singleton pattern
   */
  private constructor() {
    this.setupDetection();
  }
  
  /**
   * Sets up focus mode detection
   */
  private setupDetection(): void {
    // Check if Focus Mode API is available
    if ('notifications' in navigator) {
      // Notifications permission can be used as a proxy for Do Not Disturb mode
      this.checkNotificationsPermission();
    }
    
    // Poll for changes in document.hidden which can indicate focus mode on some platforms
    document.addEventListener('visibilitychange', () => {
      // Some browsers will suppress notifications when in focus mode
      // so we check periodically when visible
      if (!document.hidden) {
        this.checkNotificationsPermission();
      }
    });
  }
  
  /**
   * Checks notification permission as a proxy for focus mode
   */
  private async checkNotificationsPermission(): Promise<void> {
    try {
      // Try to get notification permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      // On some platforms, getNotifications() will be empty or fail 
      // when Do Not Disturb / Focus mode is active
      const wasInFocusMode = this.isFocusMode;
      
      // Modern browsers may support the 'scheduling' method in Notification
      // to check focus/DND mode
      if ('scheduling' in Notification.prototype) {
        // @ts-ignore - Type isn't recognized but this feature exists in some browsers
        const focusInfo = await Notification.scheduling.getPreferenceInfo();
        this.isFocusMode = focusInfo.doNotDisturb || false;
      } else {
        // Fallback method: try to create a test notification
        // If it gets created, focus mode is likely off
        try {
          // Try to show a dummy notification (immediately close it)
          // This will throw an error in focus mode on some devices
          if (Notification.permission === 'granted') {
            const testNotification = new Notification('Focus check', {
              silent: true,
              requireInteraction: false,
            });
            
            // If notification was created, focus mode is likely off
            testNotification.close();
            this.isFocusMode = false;
          }
        } catch (e) {
          // Error showing notification might indicate focus mode
          this.isFocusMode = true;
        }
      }
      
      // Notify listeners if focus mode status changed
      if (wasInFocusMode !== this.isFocusMode) {
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error detecting focus mode:', error);
    }
  }
  
  /**
   * Manually set focus mode for testing or for platforms without detection
   * @param isInFocusMode New focus mode state
   */
  setFocusMode(isInFocusMode: boolean): void {
    if (this.isFocusMode !== isInFocusMode) {
      this.isFocusMode = isInFocusMode;
      this.notifyListeners();
    }
  }
  
  /**
   * Gets current focus mode status
   * @returns True if in focus mode
   */
  isInFocusMode(): boolean {
    return this.isFocusMode;
  }
  
  /**
   * Register a listener for focus mode changes
   * @param listener Callback function
   */
  addListener(listener: (isFocusMode: boolean) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   * @param listener Callback function to remove
   */
  removeListener(listener: (isFocusMode: boolean) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notify all listeners of focus mode change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.isFocusMode);
    }
  }
}
