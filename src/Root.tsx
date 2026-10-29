import React from "react";
import { Composition } from "remotion";
import { Listing } from "./Listing";
import { listings } from "./data";
import { FPS, T } from "./theme";

// One composition per listing: render with `npx remotion render <id>`.
export const Root: React.FC = () => (
  <>
    {listings.map((l) => (
      <Composition key={l.id} id={l.id} component={Listing} durationInFrames={T.out} fps={FPS} width={1080} height={1920} defaultProps={l} />
    ))}
  </>
);
