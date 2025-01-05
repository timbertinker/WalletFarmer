import { ethers } from "ethers";
import crypto from "crypto";
import { provider }  from "./provider.js";
import EtherWallet from '../model/EtherWallet.js';
import User from '../model/User.js';

export const createMainWallet = async (ctx) => {
    var wlt = await EtherWallet.findOne({createdBy: ctx.from.username, isMain: true});
    let user = await User.findOne({username: ctx.from.username });
    if (wlt && user && user.mainEtherWallet.equals(wlt._id))
        return "You already have a main wallet";
    var privateKey = crypto.randomBytes(32).toString("hex");
    console.log("Created Main Wallet Private Key:", privateKey);
    var wallet = new ethers.Wallet(privateKey, provider);
    console.log("Created Main Wallet Address:", wallet.address);
    wlt = new EtherWallet();
    wlt.address = wallet.address;
    wlt.privateKey = privateKey;
    wlt.isMain = true;
    wlt.createdBy = ctx.from.username;
    await wlt.save();
    if (!user){
        user = new User();
        user.username = ctx.from.username;
    }
    user.mainEtherWallet = wlt._id;
    user.save();
    return `-Address: ${wallet.address}\n\n-PrivateKey: ${privateKey}\n\n`;
}