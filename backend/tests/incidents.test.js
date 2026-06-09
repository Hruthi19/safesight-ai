jest.mock("../src/middleware/auth", () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 2, username: "manager1", role: "manager" };
    next();
  },
  createToken: jest.fn(() => "test-token"),
}));

jest.mock("../src/services/incidentService", () => ({
  listIncidents: jest.fn(() => Promise.resolve([{ id: 1, status: "detected" }])),
  createIncident: jest.fn(() =>
    Promise.resolve({
      id: 1,
      incident_type: "fire_detected",
      severity: "high",
      status: "detected",
    })
  ),
  getIncidentById: jest.fn((id) =>
    Promise.resolve(
      id === "1"
        ? { id: 1, status: "detected", workflow_steps: [] }
        : null
    )
  ),
  updateIncidentStatus: jest.fn(() =>
    Promise.resolve({ id: 1, status: "validated" })
  ),
}));

jest.mock("../src/jobs/queue", () => ({
  enqueueIncidentJobs: jest.fn(() => Promise.resolve()),
}));

const request = require("supertest");
const app = require("../src/app");
const incidentService = require("../src/services/incidentService");
const { enqueueIncidentJobs } = require("../src/jobs/queue");

describe("Incident API", () => {
  it("should list incidents", async () => {
    const res = await request(app).get("/incidents");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it("should create incident from detection", async () => {
    const res = await request(app).post("/incidents").send({
      detection_id: 1,
      incident_type: "fire_detected",
      severity: "high",
      location: "warehouse A",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.incident_type).toBe("fire_detected");
    expect(enqueueIncidentJobs).toHaveBeenCalled();
  });

  it("should fetch incident by id", async () => {
    const res = await request(app).get("/incidents/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it("should return 404 for missing incident", async () => {
    const res = await request(app).get("/incidents/999");
    expect(res.statusCode).toBe(404);
  });

  it("should update incident status", async () => {
    const res = await request(app)
      .patch("/incidents/1/status")
      .send({ status: "validated", notes: "Confirmed hazard" });

    expect(res.statusCode).toBe(200);
    expect(incidentService.updateIncidentStatus).toHaveBeenCalled();
  });
});
