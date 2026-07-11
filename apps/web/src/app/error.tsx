"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error;
};

const Error = ({ error }: ErrorProps) => {
  useEffect(() => {
    // Replace with your error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <p>Oh no, something went wrong... maybe refresh?</p>
    </div>
  );
};

export default Error;
