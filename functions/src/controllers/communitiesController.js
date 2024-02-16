const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

const {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
} = require("firebase/firestore");

const db = getFirestore();

async function addCommunity(req, res) {
  const { name, description, location, communityImage } = req.body;

  try {
    const communityDoc = await db.collection("communities").add({
      name: name,
      announcements: [],
      members: [req.user.user_id],
      events: [],
      communityImage: communityImage,
      dateCreated: Date.now(),
      createdBy: req.user.user_id,
      description: description,
      location: location,
      newsletters: []
    });

    res.status(200).send({
      status: "success",
      message: `community added successfully with ID ${communityDoc.id}`,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
}

async function getAllCommunities(req, res) {
  try {
    const communitiesRef = db.collection("communities");
    const communitiesDocs = await communitiesRef.get();

    result = [];

    communitiesDocs.forEach((doc) => {
      result.push(doc.data());
    });

    res.status(200).json({ communities: result });
  } catch (error) {
    return res.status(500).json(error.message);
  }
}

async function getSingleCommunity(req, res) {
  try {
    const communityRef = db.collection("communities").doc(req.params.communityId);
    const doc = await communityRef.get();
    
    if (!doc.exists) {
      res
        .status(404)
        .json({ message: "The Community you requested does not exist" });
    } else {
      res.status(200).json(doc.data());
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
}

async function deleteCommunity(req, res) {
  try {
    const communityRef = db.collection("communities").doc(req.params.communityId);
    const communityDoc = await communityRef.get();
    if (!communityDoc.exists) {
      res
        .status(404)
        .json({ message: "The Community Document you requested does not exist" });
    } else if(communityDoc.data().createdBy != req.user.user_id){
     
      res
      .status(401)
      .json({ message: "User is not authorized to delete Community"})
    } else {
      await db.collection("communities").doc(req.params.communityId).delete();
      res.status(200).json({ message: "Community Document Deleted Successfully" });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
}

async function updateCommunity(req, res) {
  const shouldMerge = req.query.shouldMerge === "true";

  try {
    const communityRef = db.collection("communities").doc(req.params.communityId);
    const communityDoc = await communityRef.get();

    if (!communityDoc.exists) {
      res
        .status(404)
        .json({ message: "The Community Document you requested does not exist" });
    } else if(communityDoc.data().createdBy != req.user.user_id){
      res
      .status(401)
      .json({ message: "User is not authorized to update Community"})
    } else {
      const result = await communityRef.set(
        { ...req.body },
        { merge: shouldMerge }
      );
      res
        .status(200)
        .json({ message: `Successfully updated Community ${communityDoc.id}` });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
}

async function addMemberToCommunity(req, res) {
  const communityId = req.params.communityId;
  //ID of member to be added
  const {memberId} = req.query;

  try{
    const communityRef = db.collection("communities").doc(communityId);
  
    if(communityRef.createdBy == req.user)
    // const userRef = db.collection("users").doc(memberId);

    await communityRef.update({
      members: FieldValue.arrayUnion(memberId),
    });

    res.status(200).json({
      message: `Successfully added member to community.`
    });
  } catch(error){
    return res.status(500).json(error.message);
  }
}

async function deleteMemberFromCommunity(req, res) {
  const communityId = req.params.communityId;
  //ID of member to be deleted
  const {memberId} = req.query;
 
  try {
    const communityRef = db.collection("communities").doc(communityId);
    const communityDoc = await communityRef.get();
    const communityData = communityDoc.data();
    const originalLength = communityData.members.length;


    if(!(communityData.createdBy == req.user.user_id || memberId == req.user.user_id)){
      res
      .status(401)
      .json({ message: "User is not authorized to delete member from community"})
    }
    if(!communityData.members.includes(memberId)){
      res
      .status(404)
      .json({ message: "Member was not found in community."})
    }
    await communityRef.update({
      members: FieldValue.arrayRemove(memberId)
    });

    //prints successful even if member doesn't exist

    res.status(200).json({
      message: `Successfully removed member from community.`
    });

  } catch (error) {
    return res.status(500).json(error.message);
  }
}

module.exports = {
  getAllCommunities,
  addCommunity,
  getSingleCommunity,
  deleteCommunity,
  updateCommunity,
  addMemberToCommunity,
  deleteMemberFromCommunity
};