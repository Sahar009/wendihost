import { PROJECT_NAME } from "@/libs/constants"

const link = `${process.env.DOMAIN}/auth/workspace?id=`


export default function teamWelcomeMail(name: string, email: string, password: string, workspace: string, workspaceId: string) {

    return (`
    <!DOCTYPE html>

    <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
        <head>
            <title></title>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
            <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
            <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
            <!--[if !mso]><!-->
            <link href="https://fonts.googleapis.com/css?family=Abril+Fatface" rel="stylesheet" type="text/css"/>
            <link href="https://fonts.googleapis.com/css?family=Alegreya" rel="stylesheet" type="text/css"/>
            <link href="https://fonts.googleapis.com/css?family=Arvo" rel="stylesheet" type="text/css"/>
            <link href="https://fonts.googleapis.com/css?family=Bitter" rel="stylesheet" type="text/css"/>
            <link href="https://fonts.googleapis.com/css?family=Cabin" rel="stylesheet" type="text/css"/>
            <link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css"/>
            <!--<![endif]-->
            <style>
                * {
                    box-sizing: border-box;
                }
        
                body {
                    margin: 0;
                    padding: 0;
                }
        
             
            </style>
        </head>
        <body style="background-color: #FFFFFF; margin: 0; padding: 2px; -webkit-text-size-adjust: none; text-size-adjust: none;">

            <p style="margin-bottom:10px;">Hi ${name},  </p>        

            <p style="margin-bottom:10px;"> 
                You have been invited to join ${workspace} workspace
            </p>

            <p style="margin-bottom:10px;">
                Your login details are shown below
            </p>

            <p style="margin-bottom:10px;">

                <p>Workspace ID: ${workspaceId} </p>

                <p>Email: ${email} </p>

                <p>Password: ${password} </p>
                
            </p>

            <p style="margin-bottom:10px;">

                <p> Please follow the link to login </p>

                <a href=${link}${workspaceId}> ${link}${workspaceId} </a> 
                
            </p>

            <p style="margin-bottom:10px;">Regards,</p>
            
            <p style="margin-bottom:10px;">The ${PROJECT_NAME} Team</p>

        </body>
    </html>
    `)
}