import React from "react";
import { describe, expect, it } from "vitest";

import { htmlToText, renderEmailTemplate } from "../src/helpers";

describe("Snapshot Templates", () => {
  it("should match snapshot for simple template", async () => {
    const Template = ({ name }: { name: string }) =>
      React.createElement("div", null, `Hi ${name}`);
    const html = await renderEmailTemplate(Template, { name: "Alice" });
    expect(html).toMatchSnapshot();
  });

  it("should match text snapshot after HTML-to-text conversion", async () => {
    const Template = ({ name }: { name: string }) =>
      React.createElement("div", null, `Hi ${name}`);
    const html = await renderEmailTemplate(Template, { name: "Alice" });
    const text = htmlToText(html);
    expect(text).toMatchSnapshot();
  });
});