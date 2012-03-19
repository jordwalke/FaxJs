var F = require('Fax');

 /**
  * Groups, orders, and decides the single best match to be highlighted (aside
  * from any user intervention that overrides that highlighting. This
  * implementation is probably inneficient, but really, who cares.
  */
var groupAndOrderImpl = function(groupingParams, searchData) {
  var groupIdExtractor = groupingParams.groupIdExtractor;
  var groupTextExtractor = groupingParams.groupTextExtractor;
  var imposeGroupIdOrder = groupingParams.imposeGroupIdOrder;

  var bestMatchInOrderedIdx = searchData.matchingEntities.length &&
      searchData.text ? 0 : -1;
  var ordered = [], entriesForGroupId;
  var groupInfos = {};
  var entriesByGroupId = {};
  var i, groupId;

  for (i=0; i < searchData.matchingEntities.length; i=i+1) {
    groupId = groupIdExtractor(searchData.matchingEntities[i]);
    entriesForGroupId = entriesByGroupId[groupId] || [];
    entriesForGroupId.push(searchData.matchingEntities[i]);
    entriesByGroupId[groupId] = entriesForGroupId;
  }

  var groupUsedForOrdering = groupingParams.imposeGroupIdOrder ||
      entriesByGroupId;

  for (groupId in groupUsedForOrdering) {
    if (!groupUsedForOrdering.hasOwnProperty(groupId)) {
      continue;
    }
    entriesForGroupId = entriesByGroupId[groupId];
    if (entriesForGroupId && entriesForGroupId.length) {
      ordered = ordered.concat(entriesForGroupId);
      groupInfos['g' + groupId] = {
        text: groupTextExtractor(groupId),
        len: entriesForGroupId.length,
        grpStart: ordered.length - entriesForGroupId.length
      };
    }
  }
  var ret = {
    groupInfos: groupInfos,
    ordered: ordered,
    bestMatchInOrderedIdx: bestMatchInOrderedIdx
  };
  return ret;
};

/**
 * The following are suitable for a very wide set of group/order requirements,
 * including the case of having only a single group returned.
 */
var CustomizableGroupAndOrderer = module.exports = {

  makeKeyBasedGroupAndOrderer: function(performGroupingWith) {
    var extractGroupsByKey = performGroupingWith.extractGroupsByKey;
    var groupIdToText = performGroupingWith.groupIdToText;
    var groupIdExtractor = function(match) {
      return match[extractGroupsByKey];
    };
    var groupTextExtractor = function(groupId) {
      return groupIdToText[groupId];
    };
    return F.curryOne(groupAndOrderImpl, {
      groupIdExtractor: groupIdExtractor,
      groupTextExtractor: groupTextExtractor,
      imposeGroupIdOrder: groupIdToText
    });
  },

  makeSingleGroupAndOrderer: function(groupText) {
    var returnOneGroupId = function() {
      return 'g';
    };
    var returnOneGroupText = function() {
      return groupText;
    };
    return F.curryOne(groupAndOrderImpl, {
      groupIdExtractor: returnOneGroupId,
      groupTextExtractor: returnOneGroupText,
      imposeGroupIdOrder: null
    });
  }
};
