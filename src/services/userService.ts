import { useUserStore } from './../stores/userStore';
import { NewUser, User, SignInInfo } from './../types/user';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import storageService from './storageService';

const updateUsernameAndIconUrl = (data: {
  name: string | null;
  icon: string | null;
}) => {
  if (auth.currentUser) {
    const dataToBeUpdated = {} as { displayName?: string; photoURL?: string };
    if (data.name) dataToBeUpdated.displayName = data.name;
    if (data.icon) dataToBeUpdated.photoURL = data.icon;

    return updateProfile(auth.currentUser, dataToBeUpdated).then(() => {
      getUserProfile();
    });
  } else {
    return Promise.reject();
  }
};

const setUserToStore = (user: User) => {
  const userStore = useUserStore();
  userStore.user = user;
};

const getUserProfile = async () => {
  const user = auth.currentUser;

  if (user !== null) {
    const iconFullPath = user.photoURL ?? storageService.defaultIconFullPath;
    const iconUrl = iconFullPath.match(/^http/)
      ? iconFullPath
      : await storageService.fetchDownloadURL(iconFullPath);
    const info: User = {
      id: user.uid,
      name: user.displayName || '快乐的小猫咪',
      email: user.email || '',
      icon: {
        url: iconUrl,
        fullPath: iconFullPath,
      },
      emailVerified: user.emailVerified,
    };
    setUserToStore(info);
  }
};

function createUser(user: NewUser) {
  return createUserWithEmailAndPassword(auth, user.email, user.password).then(
    () => {
      if (auth.currentUser) {
        return updateProfile(auth.currentUser, {
          displayName: user.name,
          photoURL: user.icon,
        }).then(() => {
          getUserProfile();
        });
      }
    }
  );
}

const checkIfEmailExists = async (email: string) => {
  const res = await fetchSignInMethodsForEmail(auth, email);
  if (res.length === 0) {
    return false;
  } else {
    return true;
  }
};

const removeUserFromStore = () => {
  const userStore = useUserStore();
  userStore.user = null;
};

const logOut = () => {
  return signOut(auth).then(() => {
    // Sign-out successful.
    removeUserFromStore();
  });
};

const signIn = (signInInfo: SignInInfo) => {
  return signInWithEmailAndPassword(
    auth,
    signInInfo.email,
    signInInfo.password
  ).then(() => {
    getUserProfile();
  });
};

const signInOrLogInViaEmailLink = (email: string) => {
  const actionCodeSettings = {
    url: window.location.href + '/finishAuth/',
    handleCodeInApp: true,
  };

  return sendSignInLinkToEmail(auth, email, actionCodeSettings).then(() => {
    window.localStorage.setItem('emailForSignIn', email);
  });
};

const completeSignInViaEmailLink = (email: string) => {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    return signInWithEmailLink(auth, email, window.location.href).then(() => {
      window.localStorage.removeItem('emailForSignIn');
      getUserProfile();
    });
  } else {
    return Promise.reject();
  }
};

const sendResetPasswordEmail = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

const canUserSignInWithEmailPassword = (email: string) => {
  return fetchSignInMethodsForEmail(auth, email).then((signInMethods) => {
    if (
      signInMethods.indexOf(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD) !=
      -1
    ) {
      return true;
    }
    return false;
  });
};
export default {
  createUser,
  checkIfEmailExists,
  getUserProfile,
  logOut,
  signIn,
  signInOrLogInViaEmailLink,
  completeSignInViaEmailLink,
  updateUsernameAndIconUrl,
  sendResetPasswordEmail,
  canUserSignInWithEmailPassword,
};
