export interface SocialLink {
  name: string;
  url: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface NewsletterFormProps {
  onSubmit: (email: string) => void;
}
