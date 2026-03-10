const request = require("supertest");
const app = require("../src/app");

describe("Incident API", () => {

  it("should create incident", async () => {
    const res = await request(app)
      .post("/incidents")
      .send({
        type: "spill",
        location: "warehouse A",
        confidence: 0.89
      });

    expect(res.statusCode).toBe(201);
  });

  it("should fetch incidents", async () => {
    const res = await request(app).get("/incidents");

    expect(res.statusCode).toBe(200);
  });

});