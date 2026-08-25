import { ContactForm } from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Contact Us
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Questions about a course, a submission, or anything else — send us a
        message.
      </p>
      <ContactForm />
    </div>
  );
}
