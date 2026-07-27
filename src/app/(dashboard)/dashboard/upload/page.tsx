import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadForm } from "@/features/upload/components/UploadForm";

export default function UploadPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a project</CardTitle>
        <CardDescription>
          Deploy a static site from a single HTML file or a ZIP archive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UploadForm />
      </CardContent>
    </Card>
  );
}
