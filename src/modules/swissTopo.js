/* the last swisstopo waypoint has useful infos about the tour (especially a accurate duration)
 <extensions>
<swisstopo:waypoint_id>1813835832</swisstopo:waypoint_id>
<swisstopo:waypoint_routepoint_id>327488173</swisstopo:waypoint_routepoint_id>
<swisstopo:waypoint_meters_into_tour>10395.710160</swisstopo:waypoint_meters_into_tour>
<swisstopo:waypoint_is_controlpoint>1</swisstopo:waypoint_is_controlpoint>
<swisstopo:waypoint_stage_before distance="10395.710160" duration="19768.817305" ascent="1650.938965" descent="293.622070" />
</extensions> */

export function checkForSwissTopoInfo(x) {
  //console.log("checkForSiwssTopoInfo " + x.name, x);
  if (x.point_type != "waypoint") return;

  let extensions = x.element.getElementsByTagName("extensions");
  let swissTopoNode = null;
  if (extensions && extensions.length == 1) {
    swissTopoNode = extensions[0].querySelector("waypoint_stage_before");
  }
  if (swissTopoNode == null) {
    return;
  }

  let info = {
    ascent: +swissTopoNode.attributes["ascent"].value,
    durationSec: +swissTopoNode.attributes["duration"].value,
    length: +swissTopoNode.attributes["distance"].value,
    descent: +swissTopoNode.attributes["descent"].value,
  };

  if (info.ascent + info.durationSec + info.length + info.descent == 0) {
    return null;
  }

  let totalMinutes = info.durationSec / 60;
  let hours = totalMinutes / 60;
  let minutes = totalMinutes - parseInt(hours) * 60;

  info.estimatedHikingTimeInHours =
    parseInt(hours) + "h " + Math.ceil(minutes) + "min";

  return info;
}
