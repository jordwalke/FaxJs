var F = require('Fax');

/**
 * Some helpful logic grouped together, that several typeahead implementations
 * might find useful. Most of this is for dealing with the simple geometric
 * calculations involved in grouping.
 */
var TypeaheadUtils = module.exports = {

  constructGroups: function(headerConstructor, entityConstructor, P) {
    var all = {};
    F.objMap(P.results.groupInfos, function(groupKey, groupInfo) {
      if (!P.hideGroupHeaders) {
        all[groupKey] = headerConstructor({ groupInfo: groupInfo });
      }
      F.mapRange(P.results.ordered, function(entity, i) {
        all[groupKey + i] = entityConstructor({
          highlighted: P.highlightedEntity === entity,
          entity: entity,
          entityLinkOnMouseIn: F.curryOnly(P.onEntityMouseInIndex, i),
          entityLinkOnMouseOut: F.curryOnly(P.onEntityMouseOutIndex, i),
          entityLinkOnClick: F.curryOnly(P.onEntityClickedIndex, i)
        });
      }, groupInfo.grpStart, groupInfo.len );
    });
    return all;
  }

};
