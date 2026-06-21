const sharedVariables = {
  colorBackground: "transparent",
  colorForeground: "#ffffff",
  colorPrimary: "#d8d8d8",
  colorPrimaryForeground: "#000000",
  colorMutedForeground: "rgba(255, 255, 255, 0.55)",
  colorDanger: "#cc3333",
  colorNeutral: "rgba(255, 255, 255, 0.38)",
  colorInput: "rgba(255, 255, 255, 0.06)",
  colorInputForeground: "#ffffff",
  colorBorder: "rgba(255, 255, 255, 0.38)",
  borderRadius: "0.625rem",
} as const

export const baseClerkAppearance = {
  variables: {
    ...sharedVariables,
    colorBackground: "#000000",
  },
  elements: {
    modalContent: "glass-popover",
    navbar: "bg-transparent",
    headerTitle: "text-metallic",
  },
} as const

export const authPageClerkAppearance = {
  variables: sharedVariables,
  options: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
  },
  elements: {
    rootBox: "tw-auth-root",
    cardBox: "tw-auth-card-box",
    card: "tw-auth-card",
    header: "tw-auth-header",
    headerTitle: "tw-auth-header",
    headerSubtitle: "tw-auth-header",
    logoBox: "tw-auth-header",
    main: "tw-auth-main",
    form: "tw-auth-form",
    formFieldRow: "tw-auth-field-row",
    formField: "tw-auth-field",
    formFieldLabel: "tw-auth-field-label",
    formFieldInput: "tw-auth-field-input",
    formButtonPrimary: "tw-auth-primary-button",
    dividerLine: "tw-auth-divider-line",
    dividerText: "tw-auth-divider-text",
    socialButtonsRoot: "tw-auth-social-root",
    socialButtons: "tw-auth-social-buttons",
    socialButtonsIconButton: "tw-auth-social-icon",
    socialButtonsBlockButton: "tw-auth-social-block",
    footer: "tw-auth-footer",
    footerAction: "tw-auth-footer-action",
    footerActionText: "tw-auth-footer-text",
    footerActionLink: "tw-auth-footer-link",
    footerItem: "tw-auth-footer-item",
    identityPreviewEditButton: "tw-auth-footer-link",
  },
} as const

export const clerkProviderAppearance = baseClerkAppearance
