import axios from "axios"

// const URL_TEMP = "http://10.30.17.57:89/gcir/api/"
const URL_TEMP = "https://workflowgcir.entel.net.pe/gcir-api/"
// const URL_TEMP = "/gcir-api/";
// const URL_PYTHON = "http://localhost:3000/api/"
const URL_PLANNER = "https://desplieguegcir.entel.net.pe:84/control/api/ran/"
const URL_PYTHON = "http://10.30.17.67:3000/api/"

// const URL = "http://10.30.17.68/api/v1/"
// const URL_JIRA = "https://tdentel.atlassian.net/rest/api/3"

export const api = axios.create({
  	baseURL: URL_TEMP
})

export const apiPython = axios.create({
	baseURL: URL_PYTHON
})

export const apiPlanner = axios.create({
  	baseURL: URL_PLANNER
})

// export const apiJira = axios.create({
// 	baseURL: URL_JIRA,
// 	auth: {
// 		username: "sebastianalexis.ccopacondorivargas@emeal.nttdata.com",
// 		password: "ATATT3xFfGF0388vk1qJKv6v1b1xdIO8_y5CnGYVKJmORemiLqU5wPUt7kXtIlA5CRXMga8ECCd8ciS-gseiJaSQ0Kf4qciqh_2dks8Rcsii3pTxEHnEUjLnvDZM6biR2eKyUCKEUZFtx6pvt6GeE4ncm_9YU8AJKDiOQKAhIsZNsHEY2yQov_g=C6CD5C23"
// 	},
// 	headers: {
// 		"Content-Type": "application/json"
// 	}
// })