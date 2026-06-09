jest.mock("../src/db/pool", () => ({
  query: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db/pool");

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should login with valid credentials", async () => {
    const hash = await bcrypt.hash("manager123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 2, username: "manager1", password_hash: hash, role: "manager" },
      ],
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "manager1", password: "manager123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("manager");
  });

  it("should reject invalid credentials", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "nobody", password: "wrong" });

    expect(res.statusCode).toBe(401);
  });
});
