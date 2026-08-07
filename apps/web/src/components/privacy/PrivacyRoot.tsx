import { CookieBanner } from "./CookieBanner";
import { PreferenceCenter, usePrivacyCenterOpen } from "./PreferenceCenter";

export function PrivacyRoot() {
  const { open, setOpen, openCenter } = usePrivacyCenterOpen();

  return (
    <>
      <CookieBanner onOpenPreferences={openCenter} />
      <PreferenceCenter open={open} onClose={() => setOpen(false)} />
    </>
  );
}
