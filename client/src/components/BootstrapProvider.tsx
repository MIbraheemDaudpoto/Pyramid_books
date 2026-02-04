import { useEffect } from "react";
import "@popperjs/core";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function BootstrapProvider() {
  // Ensure bootstrap JS is evaluated once; imports handle it.
  useEffect(() => {}, []);
  return null;
}
