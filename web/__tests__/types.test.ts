import { DemoSessionSchema } from "@/lib/types";

describe("DemoSessionSchema", () => {
  it("accepts valid demo session", () => {
    const s = DemoSessionSchema.parse({
      id: "1",
      slug: "test",
      title: "DEMO · Test",
      description: "desc",
      scenario_type: "REJECT",
      data_source: "seed",
      is_demo: true,
      badge_label: "DEMO · Datos simulados",
      outcome: "REJECT",
    });
    expect(s.is_demo).toBe(true);
  });
});
