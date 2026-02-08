import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SignatureCapture from './SignatureCapture';
import { AlertTriangle } from 'lucide-react';

export default function TermsAndConditionsModal({ user, open }) {
  const [agreed, setAgreed] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const queryClient = useQueryClient();

  const updateTermsMutation = useMutation({
    mutationFn: async (signatureUrl) => {
      await base44.auth.updateMe({
        terms_agreed: true,
        terms_agreed_date: new Date().toISOString(),
        terms_signature_url: signatureUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
    }
  });

  const handleSignatureSave = async (signatureDataUrl) => {
    // Convert base64 to blob and upload
    const blob = await (await fetch(signatureDataUrl)).blob();
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateTermsMutation.mutateAsync(file_url);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <AlertTriangle className="w-5 h-5" />
            Terms and Conditions - Field Agent Agreement
          </DialogTitle>
        </DialogHeader>

        {!showSignature ? (
          <>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900">1. Introduction</h3>
                <p>
                  This agreement governs your use of the Yami Mine Solutions Spaza Compliance & Funding Readiness Platform 
                  ("the Platform") as a Field Agent. By accepting these terms, you acknowledge your responsibilities 
                  regarding data collection, privacy, and professional conduct.
                </p>

                <h3 className="font-semibold text-gray-900">2. Data Protection and Privacy (POPIA Compliance)</h3>
                <p>
                  As a Field Agent, you will collect and process personal information of shop owners and business operators. 
                  You agree to:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Only collect information necessary for shop profiling and compliance assessment</li>
                  <li>Obtain explicit consent from shop owners before collecting their personal information</li>
                  <li>Ensure all data is collected accurately and kept secure</li>
                  <li>Not use, share, or disclose personal information for any purpose other than program objectives</li>
                  <li>Comply with the Protection of Personal Information Act (POPIA) and related regulations</li>
                </ul>

                <h3 className="font-semibold text-gray-900">3. Confidentiality</h3>
                <p>
                  You agree to maintain strict confidentiality regarding:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>All personal and business information collected during shop assessments</li>
                  <li>Proprietary information about the Platform and program methodologies</li>
                  <li>Internal communications and strategic information</li>
                </ul>

                <h3 className="font-semibold text-gray-900">4. Professional Conduct</h3>
                <p>
                  You agree to:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Conduct all assessments professionally and respectfully</li>
                  <li>Represent Yami Mine Solutions ethically and responsibly</li>
                  <li>Not misrepresent information or provide false data</li>
                  <li>Report any data breaches or security concerns immediately</li>
                </ul>

                <h3 className="font-semibold text-gray-900">5. Data Handling Requirements</h3>
                <p>
                  You must:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Use only approved devices and secure connections to access the Platform</li>
                  <li>Never share your login credentials with any third party</li>
                  <li>Log out of the Platform when not in use</li>
                  <li>Delete any locally stored data immediately after synchronization</li>
                </ul>

                <h3 className="font-semibold text-gray-900">6. Consequences of Breach</h3>
                <p>
                  Violation of these terms may result in:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Immediate suspension or termination of Platform access</li>
                  <li>Legal action for damages or breach of confidentiality</li>
                  <li>Reporting to relevant regulatory authorities</li>
                </ul>

                <h3 className="font-semibold text-gray-900">7. Acceptance</h3>
                <p>
                  By checking the box below and providing your digital signature, you acknowledge that you have read, 
                  understood, and agree to comply with all terms and conditions outlined in this agreement.
                </p>
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={setAgreed}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                  I have read and agree to the Terms and Conditions. I understand my responsibilities 
                  regarding data protection, confidentiality, and professional conduct.
                </label>
              </div>

              <Button
                onClick={() => setShowSignature(true)}
                disabled={!agreed}
                className="w-full bg-blue-900 hover:bg-blue-800"
              >
                Continue to Signature
              </Button>
            </div>
          </>
        ) : (
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Please provide your digital signature to confirm your agreement:
            </p>
            <SignatureCapture
              onSave={handleSignatureSave}
              onCancel={() => setShowSignature(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}