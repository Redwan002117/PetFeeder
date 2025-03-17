/**
 * Mock implementations of UI packages for testing
 * These are only used when the real implementations are not available
 */

// Renamed to avoid conflicts with next-themes
export const mockTheme = () => ({
  theme: 'light',
  setTheme: (theme: string) => console.log(`Setting theme to ${theme}`),
  themes: ['light', 'dark']
});

// Mock components
export const MockToaster = () => null;

// Mock toast function
export const mockToast = (props: any) => {
  console.log('Toast:', props);
  return { id: 'mock-toast-id' };
};

// DayPicker mock
export const MockDayPicker = () => null;

// Command mock
export const MockCommand = Object.assign(
  () => null,
  {
    Dialog: () => null,
    Input: () => null,
    List: () => null,
    Empty: () => null,
    Group: () => null,
    Item: () => null,
    Separator: () => null,
  }
);

// Drawer mock
export const MockDrawer = Object.assign(
  () => null,
  {
    Portal: () => null,
    Overlay: () => null,
    Content: () => null,
    Header: () => null,
    Title: () => null,
    Description: () => null,
    Close: () => null,
    Footer: () => null,
  }
);

// OTP Input mock
export const MockOTPInput = () => null;
export const MockOTPInputContext = {
  Provider: ({ children }: any) => children,
  Consumer: ({ children }: any) => children
};

// Panel mocks
export const MockPanelGroup = () => null;
export const MockPanel = () => null;
export const MockPanelResizeHandle = () => null;

// Cropper mock
export const MockCropper = () => null;
