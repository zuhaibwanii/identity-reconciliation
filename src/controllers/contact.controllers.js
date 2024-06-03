import db from '../db/index.js'
import { LinkPrecedence } from '@prisma/client';

//utils
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const handleCreateContact = async (req, res) => {
    try {

        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) return res.status(400).json(new ApiError(400, "Email or phone number must be provided"));

         db.$transaction(async (tx) => {
            // Find contacts matching the email or phone number
            const existingContacts = await tx.contact.findMany({
                where: {
                    OR: [
                        { email },
                        { phoneNumber }
                    ]
                },
                orderBy: {
                    createdAt: 'asc'//to get the oldest primary contact first
                }
            });

            let primaryContact;
            let secondaryContact = [];
            if (existingContacts.length) {
                //handle primary contacts turn into secondary
                const allPrimary = existingContacts.filter(contact => contact.linkPrecedence === LinkPrecedence.primary);
                if (allPrimary.length > 1) {
                    let oldestPrimary = allPrimary[0];
                    primaryContact = allPrimary[0];
                    const tempSecondary = []
                    for (let i = 0; i < allPrimary.length; i++) {
                        if (allPrimary[i].id !== oldestPrimary.id) {
                            await tx.contact.update({
                                where: { id: allPrimary[i].id },
                                data: {
                                    linkedId: oldestPrimary.id,
                                    linkPrecedence: LinkPrecedence.secondary
                                }
                            });
                            tempSecondary.push({ id: allPrimary[i].id, email: allPrimary[i].email, phoneNumber: allPrimary[i].phoneNumber })

                        }
                    }
                    secondaryContact = [...tempSecondary];

                } else {
                    primaryContact = existingContacts[0];
                    let newSecondary = await tx.contact.create({
                        data: {
                            email,
                            phoneNumber,
                            linkedId: primaryContact.id,
                            linkPrecedence: LinkPrecedence.secondary
                        }
                    });

                    secondaryContact = [{ id: newSecondary.id, email: newSecondary.email, phoneNumber: newSecondary.phoneNumber }];
                    const existingSecondary = existingContacts.filter(contact => contact.linkPrecedence === LinkPrecedence.secondary);
                    secondaryContact = [...existingSecondary, ...secondaryContact];
                }

            } else {
                //Create new entry
                primaryContact = await tx.contact.create({
                    data: {
                        email,
                        phoneNumber,
                        linkPrecedence: LinkPrecedence.primary
                    }
                });


            }

            const consolidatedContact = {
                primaryContactId: primaryContact.id,//there will always be a primaryContact
                emails: [],
                phoneNumbers: [],
                secondaryContactIds: []
            };

            //To avoid pushing null values
            if (primaryContact.email) consolidatedContact.emails = [primaryContact.email];
            if (primaryContact.phoneNumber) consolidatedContact.phoneNumbers = [primaryContact.phoneNumber];

            if (secondaryContact.length) {
                consolidatedContact.emails = [...new Set([...consolidatedContact.emails, ...secondaryContact.map(contact => contact.email)])];
                consolidatedContact.secondaryContactIds = [...new Set(secondaryContact.map(contact => contact.id))];
                consolidatedContact.phoneNumbers = [...new Set([...consolidatedContact.phoneNumbers, ...secondaryContact.map(contact => contact.phoneNumber)])];
            }


            return res.status(200).json(new ApiResponse(200, { contact: consolidatedContact }, `Success`));

        });


    } catch (error) {
        // console.log('error = ', error);
        return res.status(500).json(new ApiError(500, "Internal server error", error?.errors || error));
    }

}



export { handleCreateContact }