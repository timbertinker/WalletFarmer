import mongoose from "mongoose";

// Define the Follow schema
const UserSchema = new mongoose.Schema({
    username: { type: String, requried: true, unique: true},
    mainEtherWallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ether_wallet'
    },
    subEtherWallets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ether_wallet'
    }],
    etherTokenAddress: { type: String },
    etherTokenDecimal: { type: Number },
    etherTokenName: { type: String },
    defaultAmountForEther: { type: String, default: "0.01" },
    swapAmountForEther: { type: String, default: "0.01" },
    repeatCountForEther: {type: Number, default: 1 },
    mainSolanaWallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'solana_wallet'
    },
    subSolanaWallet: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'solana_wallet'
    }],
    solanaTokenAddress: { type: String },
    solanaTokenDecimal: { type: Number },
    solanaTokenName: { type: String },
    defaultAmountForSolana: { type: String, default: "0.01" },
    swapAmountForSolana: { type: String, default: "0.01" },
    repeatCountForSolana: {type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('user', UserSchema);

export default User;