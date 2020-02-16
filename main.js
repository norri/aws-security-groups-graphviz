var AWS = require('aws-sdk');
const { saveGraphToFile } = require('./render');

const nameFromTagOrGroupName = (group) => {
  const nameTag = group.Tags.filter(t => t.Key === 'Name');
  return (nameTag && nameTag[0]) ? nameTag[0].Value : group.GroupName;
}

const getName = (securityGroups, id) => {
  const match = securityGroups.filter(group => group.GroupId === id);
  if (match && match[0]) {
    return nameFromTagOrGroupName(match[0]);
  }
  return 'External: ' + id
}

const mapSecurityGroups = (securityGroups) => {
  return securityGroups.map(group => {
    return {
      name: nameFromTagOrGroupName(group),
      connections: group.IpPermissions.flatMap(permission => {
        var results = [];
        const port = permission.ToPort ? permission.ToPort : 'All';
        permission.IpRanges.forEach(ip => {
          results.push({
            name: ip.CidrIp,
            port: port
          });
        })
        permission.UserIdGroupPairs.forEach(pair => {
          results.push({
            name: getName(securityGroups, pair.GroupId),
            port: port
          });
        })
        return results;
      })
    }
  });
}

const mapToGraphviz = (groups) => {
  return groups.flatMap(group => {
    return group.connections.flatMap(connection => {
      return `\"${connection.name}\" -> \"${group.name}\" [label=${connection.port}];`;
    })
  });
}

// Validate start script
if (!process.argv[2]) {
  console.log('Please provide region and export filename, ex. node main.js us-east-1 sg-graph.svg');
  return;
}

AWS.config.update({ region: process.argv[2] });
var ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

const filename = process.argv[3] ? process.argv[3] : 'security-groups.svg';

// Retrieve security group descriptions
ec2.describeSecurityGroups({}, function (err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log(JSON.stringify(data.SecurityGroups, null, "  "));
    const groups = mapSecurityGroups(data.SecurityGroups);
    const graph =
      `digraph G {
        ${mapToGraphviz(groups).join("\n")}
      }`;
    saveGraphToFile(graph, filename);
  }
});
