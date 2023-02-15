const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const DBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

DBServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateDetails = `
    SELECT *
    FROM state;`;
  const statesArray = await db.all(getStateDetails);
  response.send(
    statesArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetails = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;
  const statesArray = await db.get(getStateDetails);
  response.send(convertDbObjectToResponseObject(statesArray));
});

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
  const getStateDetails = `
   INSERT INTO
       district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
      );`;
  const statesArray = await db.run(getStateDetails);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetails = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;
  const statesArray = await db.get(getStateDetails);
  response.send(convertDbObjectToResponseObject2(statesArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetails = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  const statesArray = await db.run(getStateDetails);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const getStateDetails = `
   UPDATE district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths};`;
  const statesArray = await db.run(getStateDetails);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetails = `
    SELECT cases, cured, active, deaths
    FROM district 
    WHERE state_id = ${stateId}
    GROUP BY state_id;`;
  const statesArray = await db.get(getStateDetails);
  console.log(statesArray);
  response.send({
    totalCases: statesArray.cases,
    totalCured: statesArray.cured,
    totalActive: statesArray.active,
    totalDeaths: statesArray.deaths,
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
