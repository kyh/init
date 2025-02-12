import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { allDocs } from "@init/mdx";

const homePage = "overview/introduction";

const Page = () => {
  const currentDoc = allDocs.find((doc) => {
    const slug = doc._meta.filePath.replace(/\.mdx$/, "");
    return slug === homePage;
  });

  if (!currentDoc) {
    return notFound();
  }

  return <MDXContent code={currentDoc.mdx} />;
};

export default Page;
