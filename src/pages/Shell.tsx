import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listProducts } from "@/lib/api";
import { ShellStory } from "@/components/shell/Story";
import { SEO } from "@/components/shared";

export default function ShellPage() {
  const { i18n } = useTranslation();
  const productsQ = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const title = i18n.resolvedLanguage === "bn" ? "খোলসের গল্প" : "The Shell Story";
  return (
    <>
      <SEO title={title} description={i18n.resolvedLanguage === "bn" ? "চিংড়ির খোলস থেকে কীভাবে উপযোগী উপাদান ও পণ্য তৈরি হয় জানুন।" : "Learn how useful materials and products are made from shrimp shells."} />
      <ShellStory products={productsQ.data ?? []} />
    </>
  );
}
