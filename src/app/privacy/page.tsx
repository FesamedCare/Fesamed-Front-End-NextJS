"use client";

import { LegalPlaceholder } from "../ui/legal/legal-placeholder";
import Footer from "../ui/navigation/footer";

export default function PrivacyPage() {
  return (
    <>
      <LegalPlaceholder title="legal.privacyTitle" withAuthorization />
      <Footer />
    </>
  );
}
