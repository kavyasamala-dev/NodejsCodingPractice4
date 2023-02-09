const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("connected Successfully");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

connection();

let convertToCamel = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

let convertToCamelDistrict = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//GET state

app.get("/states/", async (request, response) => {
  const statesQuery = `SELECT * FROM state;`;
  const stateArray = await db.all(statesQuery);
  response.send(stateArray.map((eachstate) => convertToCamel(eachstate)));
});

//GET state using stateid
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertToCamel(stateArray));
});

//POST new district
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtQuery = `
        INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
        VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;

  await db.run(districtQuery);
  response.send("District Successfully Added");
});

//GET district by districtid

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT * FROM district
         WHERE district_id = ${districtId};`;

  const district = await db.get(districtQuery);
  response.send(convertToCamelDistrict(district));
});

//DELETE District
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district
        WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

// UPDATE district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;
  const updateQuery = `UPDATE district
      SET district_name = '${districtName}',
          state_id = ${stateId},
          cases = ${cases},
          cured = ${cured},
          active = ${active},
          deaths = ${deaths}
      WHERE district_id = ${districtId};`;

  await db.run(updateQuery);
  response.send("District Details Updated");
});

//GET STATISTICS
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const statistics = `SELECT SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
        FROM district
        WHERE state_id = ${stateId};`;
  const statArray = await db.get(statistics);
  response.send({
    totalCases: statArray["SUM(cases)"],
    totalCured: statArray["SUM(cured)"],
    totalActive: statArray["SUM(active)"],
    totalDeaths: statArray["SUM(deaths)"],
  });
});

//GET stateName
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const Query = `SELECT state_name FROM state INNER JOIN district ON (state.state_id = district.state_id)
        WHERE district_id = ${districtId};`;
  const stateName = await db.get(Query);
  response.send({
    stateName: `${stateName.state_name}`,
  });
});

module.exports = app;
