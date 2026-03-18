import {
  BusinessUnitRecord,
  DestinationTypeRecord,
  QRCodeRecord,
} from "@/lib/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { QRCodeEditorForm } from "@/forms/qr/qr-code-editor-form";
const QRCodeEditorDialog = ({
  businessUnits,
  destinationTypes,
  open,
  onOpenChange,
  qrCode,
  onSaved,
}: {
  businessUnits: BusinessUnitRecord[];
  destinationTypes: DestinationTypeRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeRecord | null;
  onSaved: (qrCode: QRCodeRecord) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-x-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {qrCode ? `Edit ${qrCode.slug}` : "Create a QR code"}
          </DialogTitle>
          <DialogDescription>
            The printed QR code always points to the CMS redirect URL. You can
            change the final destination later without reprinting it.
          </DialogDescription>
        </DialogHeader>
        <QRCodeEditorForm
          businessUnits={businessUnits}
          destinationTypes={destinationTypes}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          qrCode={qrCode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeEditorDialog;
