// vite.config.ts
import vue from "file:///C:/Users/apiwa/Desktop/Desktop-NestJS/apps/desktop/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "node:path";
import Components from "file:///C:/Users/apiwa/Desktop/Desktop-NestJS/node_modules/unplugin-vue-components/dist/vite.js";
import { defineConfig } from "file:///C:/Users/apiwa/Desktop/Desktop-NestJS/apps/desktop/node_modules/vite/dist/node/index.js";
import electron from "file:///C:/Users/apiwa/Desktop/Desktop-NestJS/node_modules/vite-plugin-electron/dist/simple.mjs";
var __vite_injected_original_dirname = "C:\\Users\\apiwa\\Desktop\\Desktop-NestJS\\apps\\desktop";
var vite_config_default = defineConfig(({ mode }) => {
  const isWebOnly = process.env.ELECTRON_DISABLE === "1";
  const plugins = [
    vue(),
    Components({
      dts: true,
      dirs: ["src/components"],
      resolvers: [
        // Custom resolver for UI components
        (componentName) => {
          if (componentName.startsWith("Alert") || componentName.startsWith("Dialog") || componentName.startsWith("Button") || componentName.startsWith("Input") || componentName.startsWith("Label") || componentName.startsWith("Select") || componentName.startsWith("Card") || componentName.startsWith("Badge") || componentName.startsWith("Tabs") || componentName.startsWith("Table") || componentName.startsWith("Checkbox") || componentName.startsWith("Avatar") || componentName.startsWith("Dropdown") || componentName.startsWith("Sheet") || componentName.startsWith("Popover") || componentName.startsWith("Command") || componentName.startsWith("Separator") || componentName.startsWith("Scroll") || componentName.startsWith("Toast") || componentName.startsWith("Switch") || componentName.startsWith("Radio") || componentName.startsWith("Slider") || componentName.startsWith("Progress") || componentName.startsWith("Skeleton")) {
            const dirMap = {
              "Alert": "alert",
              "AlertDialog": "alert-dialog",
              "Button": "button",
              "Card": "card",
              "Dialog": "dialog",
              "Input": "input",
              "Label": "label",
              "Select": "select",
              "Badge": "badge",
              "Tabs": "tabs",
              "Table": "table",
              "Checkbox": "checkbox",
              "Avatar": "avatar",
              "Dropdown": "dropdown-menu",
              "Sheet": "sheet",
              "Popover": "popover",
              "Command": "command",
              "Separator": "separator",
              "Scroll": "scroll-area",
              "Toast": "toast",
              "Switch": "switch",
              "Radio": "radio-group",
              "Slider": "slider",
              "Progress": "progress",
              "Skeleton": "skeleton"
            };
            for (const [prefix, dir] of Object.entries(dirMap)) {
              if (componentName.startsWith(prefix)) {
                return {
                  name: componentName,
                  from: `@/components/ui/${dir}`
                };
              }
            }
          }
        }
      ]
    })
  ];
  if (!isWebOnly) {
    plugins.push(
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: "electron/main.ts"
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__vite_injected_original_dirname, "electron/preload.ts")
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === "test" ? void 0 : {}
      })
    );
  }
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: ["app.ytrc.co.th", "localhost", "122.154.46.21"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhcGl3YVxcXFxEZXNrdG9wXFxcXERlc2t0b3AtTmVzdEpTXFxcXGFwcHNcXFxcZGVza3RvcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYXBpd2FcXFxcRGVza3RvcFxcXFxEZXNrdG9wLU5lc3RKU1xcXFxhcHBzXFxcXGRlc2t0b3BcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FwaXdhL0Rlc2t0b3AvRGVza3RvcC1OZXN0SlMvYXBwcy9kZXNrdG9wL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IGVsZWN0cm9uIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uL3NpbXBsZSdcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBpc1dlYk9ubHkgPSBwcm9jZXNzLmVudi5FTEVDVFJPTl9ESVNBQkxFID09PSAnMSdcclxuXHJcbiAgY29uc3QgcGx1Z2lucyA9IFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgQ29tcG9uZW50cyh7XHJcbiAgICAgIGR0czogdHJ1ZSxcclxuICAgICAgZGlyczogWydzcmMvY29tcG9uZW50cyddLFxyXG4gICAgICByZXNvbHZlcnM6IFtcclxuICAgICAgICAvLyBDdXN0b20gcmVzb2x2ZXIgZm9yIFVJIGNvbXBvbmVudHNcclxuICAgICAgICAoY29tcG9uZW50TmFtZSkgPT4ge1xyXG4gICAgICAgICAgLy8gQXV0by1pbXBvcnQgZnJvbSBjb21wb25lbnRzL3VpLypcclxuICAgICAgICAgIGlmIChjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0FsZXJ0JykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdEaWFsb2cnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0J1dHRvbicpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnSW5wdXQnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0xhYmVsJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdTZWxlY3QnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0NhcmQnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0JhZGdlJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdUYWJzJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdUYWJsZScpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnQ2hlY2tib3gnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ0F2YXRhcicpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnRHJvcGRvd24nKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ1NoZWV0JykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdQb3BvdmVyJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdDb21tYW5kJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50TmFtZS5zdGFydHNXaXRoKCdTZXBhcmF0b3InKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ1Njcm9sbCcpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnVG9hc3QnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ1N3aXRjaCcpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnUmFkaW8nKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ1NsaWRlcicpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnUHJvZ3Jlc3MnKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgoJ1NrZWxldG9uJykpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcCBjb21wb25lbnQgbmFtZXMgdG8gdGhlaXIgZGlyZWN0b3JpZXNcclxuICAgICAgICAgICAgY29uc3QgZGlyTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgICAgICAgICAgICdBbGVydCc6ICdhbGVydCcsXHJcbiAgICAgICAgICAgICAgJ0FsZXJ0RGlhbG9nJzogJ2FsZXJ0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICAgJ0J1dHRvbic6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICdDYXJkJzogJ2NhcmQnLFxyXG4gICAgICAgICAgICAgICdEaWFsb2cnOiAnZGlhbG9nJyxcclxuICAgICAgICAgICAgICAnSW5wdXQnOiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICdMYWJlbCc6ICdsYWJlbCcsXHJcbiAgICAgICAgICAgICAgJ1NlbGVjdCc6ICdzZWxlY3QnLFxyXG4gICAgICAgICAgICAgICdCYWRnZSc6ICdiYWRnZScsXHJcbiAgICAgICAgICAgICAgJ1RhYnMnOiAndGFicycsXHJcbiAgICAgICAgICAgICAgJ1RhYmxlJzogJ3RhYmxlJyxcclxuICAgICAgICAgICAgICAnQ2hlY2tib3gnOiAnY2hlY2tib3gnLFxyXG4gICAgICAgICAgICAgICdBdmF0YXInOiAnYXZhdGFyJyxcclxuICAgICAgICAgICAgICAnRHJvcGRvd24nOiAnZHJvcGRvd24tbWVudScsXHJcbiAgICAgICAgICAgICAgJ1NoZWV0JzogJ3NoZWV0JyxcclxuICAgICAgICAgICAgICAnUG9wb3Zlcic6ICdwb3BvdmVyJyxcclxuICAgICAgICAgICAgICAnQ29tbWFuZCc6ICdjb21tYW5kJyxcclxuICAgICAgICAgICAgICAnU2VwYXJhdG9yJzogJ3NlcGFyYXRvcicsXHJcbiAgICAgICAgICAgICAgJ1Njcm9sbCc6ICdzY3JvbGwtYXJlYScsXHJcbiAgICAgICAgICAgICAgJ1RvYXN0JzogJ3RvYXN0JyxcclxuICAgICAgICAgICAgICAnU3dpdGNoJzogJ3N3aXRjaCcsXHJcbiAgICAgICAgICAgICAgJ1JhZGlvJzogJ3JhZGlvLWdyb3VwJyxcclxuICAgICAgICAgICAgICAnU2xpZGVyJzogJ3NsaWRlcicsXHJcbiAgICAgICAgICAgICAgJ1Byb2dyZXNzJzogJ3Byb2dyZXNzJyxcclxuICAgICAgICAgICAgICAnU2tlbGV0b24nOiAnc2tlbGV0b24nLFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5kIG1hdGNoaW5nIGRpcmVjdG9yeVxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtwcmVmaXgsIGRpcl0gb2YgT2JqZWN0LmVudHJpZXMoZGlyTWFwKSkge1xyXG4gICAgICAgICAgICAgIGlmIChjb21wb25lbnROYW1lLnN0YXJ0c1dpdGgocHJlZml4KSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgbmFtZTogY29tcG9uZW50TmFtZSxcclxuICAgICAgICAgICAgICAgICAgZnJvbTogYEAvY29tcG9uZW50cy91aS8ke2Rpcn1gXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9KSxcclxuICBdXHJcblxyXG4gIC8vIE9ubHkgYWRkIGVsZWN0cm9uIHBsdWdpbiBpZiBub3QgaW4gd2ViLW9ubHkgbW9kZVxyXG4gIGlmICghaXNXZWJPbmx5KSB7XHJcbiAgICBwbHVnaW5zLnB1c2goXHJcbiAgICAgIGVsZWN0cm9uKHtcclxuICAgICAgICBtYWluOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQubGliLmVudHJ5YC5cclxuICAgICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi50cycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVsb2FkOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAuXHJcbiAgICAgICAgICAvLyBQcmVsb2FkIHNjcmlwdHMgbWF5IGNvbnRhaW4gV2ViIGFzc2V0cywgc28gdXNlIHRoZSBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAgaW5zdGVhZCBgYnVpbGQubGliLmVudHJ5YC5cclxuICAgICAgICAgIGlucHV0OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZWxlY3Ryb24vcHJlbG9hZC50cycpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gUGxveWZpbGwgdGhlIEVsZWN0cm9uIGFuZCBOb2RlLmpzIEFQSSBmb3IgUmVuZGVyZXIgcHJvY2Vzcy5cclxuICAgICAgICAvLyBJZiB5b3Ugd2FudCB1c2UgTm9kZS5qcyBpbiBSZW5kZXJlciBwcm9jZXNzLCB0aGUgYG5vZGVJbnRlZ3JhdGlvbmAgbmVlZHMgdG8gYmUgZW5hYmxlZCBpbiB0aGUgTWFpbiBwcm9jZXNzLlxyXG4gICAgICAgIC8vIFNlZSBcdUQ4M0RcdURDNDkgaHR0cHM6Ly9naXRodWIuY29tL2VsZWN0cm9uLXZpdGUvdml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXJcclxuICAgICAgICByZW5kZXJlcjogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICd0ZXN0J1xyXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2VsZWN0cm9uLXZpdGUvdml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXIvaXNzdWVzLzc4I2lzc3VlY29tbWVudC0yMDUzNjAwODA4XHJcbiAgICAgICAgICA/IHVuZGVmaW5lZFxyXG4gICAgICAgICAgOiB7fSxcclxuICAgICAgfSkgYXMgYW55XHJcbiAgICApXHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcGx1Z2lucyxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiB0cnVlLFxyXG4gICAgICBwb3J0OiA1MTczLFxyXG4gICAgICBhbGxvd2VkSG9zdHM6IFsnYXBwLnl0cmMuY28udGgnLCAnbG9jYWxob3N0JywgJzEyMi4xNTQuNDYuMjEnXSxcclxuICAgIH0sXHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNWLE9BQU8sU0FBUztBQUN0VyxPQUFPLFVBQVU7QUFDakIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxjQUFjO0FBSnJCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sWUFBWSxRQUFRLElBQUks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
