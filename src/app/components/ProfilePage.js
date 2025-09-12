"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaLock, FaUnlock, FaTrash } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserImages(currentUser.uid);
      }
    });
  }, []);

  const fetchUserImages = async (userId) => {
    const q = query(collection(db, "images"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    setUserImages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const togglePrivacy = async (imageId, currentPrivacy) => {
    const imageRef = doc(db, "images", imageId);
    await updateDoc(imageRef, { isPublic: !currentPrivacy });
    fetchUserImages(user.uid);
  };

  const deleteImage = async (imageId) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await deleteDoc(doc(db, "images", imageId));
      fetchUserImages(user.uid);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4 text-pink-400">Your Profile</h2>
      <div className="mb-4 flex justify-between items-center">
        {user ? (
          <div className="flex items-center space-x-4">
            <Image src={user.photoURL} alt={user.displayName} width={40} height={40} className="rounded-full" />
            <p className="text-white">{user.displayName}</p>
            <button onClick={() => signOut(auth)} className="bg-red-500 px-4 py-2 rounded-lg text-white">Sign Out</button>
          </div>
        ) : (
          <p className="text-white">Please log in to view your profile.</p>
        )}
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {userImages.map((item, index) => (
          <div key={index} className="relative break-inside-avoid shadow-lg rounded-lg overflow-hidden bg-black">
            <Image 
              src={item.imageUrl} 
              alt={`Your Upload ${index}`} 
              width={500}
              height={750}
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute bottom-2 left-2 flex space-x-3 bg-black/60 p-2 rounded-lg">
              <button onClick={() => togglePrivacy(item.id, item.isPublic)} className="text-white flex items-center space-x-1">
                {item.isPublic ? <FaLock /> : <FaUnlock />}
              </button>
              <button onClick={() => deleteImage(item.id)} className="text-white flex items-center space-x-1">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
