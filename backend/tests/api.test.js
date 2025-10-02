const request = require("supertest");
const app = require("../index"); 

describe("Incident API", () => {
  it("should return 201 on incident creation", async () => {
    const res = await request(app)
      .post("/incidents")
      .send({ description: "Slip detected" });
    expect(res.statusCode).toBe(201);
  });
});
