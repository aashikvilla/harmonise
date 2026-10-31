import { Suspense } from "react";
import ProductRoute from "@/components/product-route";

export default function ProductPage() {
  return <Suspense fallback={<main className="app-shell"><p className="page-kicker">HARMONISE · YOUR SPACE</p><h1>Opening your space…</h1></main>}><ProductRoute /></Suspense>;
}
