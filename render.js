const fs = require("fs");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');

// const graphExample = `
// digraph G {
// 	"0.0.0.0/0" -> "External-LB-sg" [label="443"];
// 	"External-LB-sg" -> "App1-EC2-sg" [label="80"];
//     "App1-EC2-sg" -> "RDS-MySQL-sg" [label="3306"];
//     "App1-EC2-sg" -> "Redis-Cluster-sg" [label="6379"];
//     "0.0.0.0/0" -> "Bastion-EC2-sg" [label="22"];
//     "Bastion-EC2-sg" -> "App1-EC2-sg" [label="22"];
// }`;

const saveGraphToFile = (graph, filePath) => {
  let viz = new Viz({ Module, render });
  viz
    .renderString(graph)
    .then(svgString => writeFile(filePath, svgString))
    .catch(error => {
      viz = new Viz({ Module, render });
      console.error(error);
    });
}

module.exports = {
  saveGraphToFile
};