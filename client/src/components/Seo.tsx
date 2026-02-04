import { useEffect } from "react";

export default function Seo(props: { title: string; description?: string }) {
  useEffect(() => {
    document.title = props.title;
    const description = props.description ?? "Pyramid Books — book distribution management.";
    let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.name = "description";
      document.head.appendChild(el);
    }
    el.content = description;
  }, [props.title, props.description]);

  return null;
}
