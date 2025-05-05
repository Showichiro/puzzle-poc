export const isPlatformAuthenticatorAvailable = () => {
  if (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof window.PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable === "function"
  ) {
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }
};
