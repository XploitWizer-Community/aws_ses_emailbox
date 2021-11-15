import React, {useState, useEffect, useRef} from 'react';
import JoditEditor from "jodit-react";
import axios from 'axios';
import { ADDRESS_DELIM, DEFAULT_FQDN, EMAIL_CONTENT_URL, BCC_EMAIL } from '../../constants';

const getFromEmail = () => {
  let idToken = JSON.parse(localStorage.userDetails).id_token;
  let username = JSON.parse(atob(idToken.split('.')[1]))["cognito:username"];
  let email = JSON.parse(atob(idToken.split('.')[1])).email.split("@")[0];
  if(username)
    return `${username}@${DEFAULT_FQDN}`;
  return `${email}@${DEFAULT_FQDN}`
}

const EmailComposeModal = ({setEmailComposeModalIsVisible, emailList, emailComposeModalIsVisible, isReply}) => {
    const [sendEmailDetails, setSendEmailDetails] = useState({
      toEmail: "",
      ccEmail: "",
      sender: localStorage.userDetails ? getFromEmail() : "",
      emailSubject: "",
    });
    const [htmlEmailContent, setHtmlEmailContent]= useState(undefined);
    const [emailSendStatus, setEmailSendStatus] = useState(undefined);
    const [emailSendStatusMessage, setEmailSendStatusMessage]= useState(undefined);
    useEffect(() => {
      if(emailList.currentEmail){
        clearEmailDestinations();
        setEmailDestinations();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailList.currentEmail, isReply])

    const setEmailDestinations= async () =>{
      if(emailList.currentEmail && emailList.currentEmail.emailContent && isReply){
        let tempEmailSubject = emailList.currentEmail.emailContent.subject || "(no subject)";
        let tempToEmail = getToEmail(emailList.currentEmail.emailContent);
        let tempCcEmail = getCcEmail(emailList.currentEmail.emailContent);
        let tempFromEmail = sendEmailDetails.sender;
        let messageId = getOriginalMessageId(emailList.currentEmail.emailContent);
        if(tempToEmail.indexOf(tempFromEmail) > -1) tempToEmail.splice(tempToEmail.indexOf(tempFromEmail), 1);
        if(tempCcEmail.indexOf(tempFromEmail) > -1) tempCcEmail.splice(tempCcEmail.indexOf(tempFromEmail), 1);
        let duplicates = tempToEmail.filter((email) => tempCcEmail.indexOf(email) > -1);
        duplicates.map(d => tempCcEmail.splice(tempCcEmail.indexOf(d), 1));
        tempToEmail = tempToEmail.length > 0 ? tempToEmail.join(ADDRESS_DELIM) : undefined;
        tempCcEmail = tempCcEmail.length > 0 ? tempCcEmail.join(ADDRESS_DELIM) : undefined;
        await setSendEmailDetails({ ...sendEmailDetails, 
            ccEmail: tempCcEmail, 
            emailSubject: tempEmailSubject, 
            toEmail: tempToEmail, 
            references: messageId});
      }
    };
    const clearEmailDestinations= async ()=>{
      await setSendEmailDetails({sender: getFromEmail(), ccEmail: "", emailSubject: "", toEmail: ""})
    };
    const getToEmail = (emailContent) => {
      let email =[];
      if(emailContent && emailContent.from){
        emailContent.from.value.forEach(value => email.push(value.address));
      }
      if(emailContent && emailContent.to)
        emailContent.to.value.forEach(value => email.push(value.address));
      return email;
    }

    const getCcEmail = (emailContent) => {
      let email =[];
      if(emailContent && emailContent.cc){
        emailContent.cc.value.forEach(value => email.push(value.address));
      }
      return email;
    }

    const getOriginalMessageId = (emailContent) => (emailContent.headers ?? {})["message-id"] ?? undefined;

    const handleChange = (e) => {
        const {name, value} = e.target;
        setSendEmailDetails({...sendEmailDetails, [name]: value})
    }

    const editor = useRef(null)
    
    const config = {
      readonly: false, // all options from https://xdsoft.net/jodit/doc/
      height: '50vh',
      width: '100%',
      allowResizeX: false,
      allowResizeY: false,
      showCharsCounter: false,
      showWordsCounter: false,
    }
    const sendEmail = async (e) => {
      e.preventDefault();
      if(sendEmailDetails.toEmail && sendEmailDetails.sender){
          let toEmail = sendEmailDetails.toEmail || [];
          let ccEmail = sendEmailDetails.ccEmail || []
          if(!Array.isArray(toEmail)) toEmail = toEmail.split(ADDRESS_DELIM)
          if(!Array.isArray(ccEmail)) ccEmail = ccEmail.split(ADDRESS_DELIM)
          toEmail = toEmail.map(email => email.trim());
          ccEmail = ccEmail.map(email => email.trim());
          var body = {
            to: toEmail,
            cc: ccEmail,
            bcc: [BCC_EMAIL],
            from_email: sendEmailDetails.sender,
            from_name: sendEmailDetails.sender.split("@")[0],
            subject: sendEmailDetails.emailSubject,
            text_part: document.getElementById("editor").innerText,
            html_part: htmlEmailContent,
            references: sendEmailDetails.references || undefined,
          };
          setEmailSendStatus('success')
          setEmailSendStatusMessage('Sending...');
          await axios({
            url: `${EMAIL_CONTENT_URL}?domain=${DEFAULT_FQDN}`,
            headers: {'Authorization': JSON.parse(localStorage.userDetails).id_token},
            method: 'POST',
            data: body
          })
          .then( (response) => {
            setEmailSendStatus('success'); 
            setEmailSendStatusMessage('Mail sent!');
            setEmailComposeModalIsVisible(false);
            setSendEmailDetails({sender: getFromEmail(), ccEmail: "", emailSubject: "", toEmail: ""});
            setHtmlEmailContent("");
          })
          .catch(e => {
            console.log(e);
            let tempEmailSendStatus = 'failed';
            let tempEmailSendStatusMessage = 'Mail could not be sent';
            if(e.message.indexOf('not authorized') > -1) tempEmailSendStatusMessage += ". Check your AWS permissions.";
            else tempEmailSendStatusMessage += '(' + e.message + ')';
            setEmailSendStatus(tempEmailSendStatus);
            setEmailSendStatusMessage(tempEmailSendStatusMessage);
          });
        } else {
          let tempEmailSendStatus = 'failed';
          let tempEmailSendStatusMessage = `${!sendEmailDetails.toEmail? (!sendEmailDetails.fromEmail ? "TO: and FROM:":"TO:") : (!sendEmailDetails.fromEmail ? "FROM:":"")} Missing`;
          setEmailSendStatus(tempEmailSendStatus);
          setEmailSendStatusMessage(tempEmailSendStatusMessage);
        }
    }
    return (
        <div id="emailComposeModal" className={emailComposeModalIsVisible ? 'is-active modal':'modal'}>
            <div className="modal-background" style={{"opacity":"75%"}} ></div>
            <div className="modal-card" style={{width: '90%'}}>
            <header className="modal-card-head">
                <p className="modal-card-title is-medium">New Email: Frontpage</p>
                <p className={emailSendStatus === 'success'? 'has-text-primary' : 'has-text-danger'}><sub> {emailSendStatusMessage}</sub></p>
            </header>
            <section className="modal-card-body">
                <div className="content is-normal">
                  <div className="container flex justify-between sendEmailMetadataContainer">
                    <div className="field">
                      <div className="control has-icons-left">
                          <input className="input" type="email" placeholder="TO: email1; email2;" value={sendEmailDetails.toEmail} name="toEmail" onChange={handleChange} />
                          <sub>(Separate multiple TO: emails with commas,)</sub>
                          <span className="icon is-small is-left">
                            <i className="fa fa-envelope"></i>
                          </span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="control has-icons-left">
                          <input className="input" type="email" placeholder="CC: : email3; email4;" value={sendEmailDetails.ccEmail} name="ccEmail" onChange={handleChange} />
                          <sub>(Separate multiple CC: emails with commas,)</sub>
                          <span className="icon is-small is-left">
                            <i className="fa fa-envelope"></i>
                          </span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="control has-icons-left">
                          <input className="input" type="email" placeholder="FROM: email" value={sendEmailDetails.sender} name="sender" onChange={handleChange}/>
                          <sub>(Enter a valid FROM email)</sub>
                          <span className="icon is-small is-left">
                            <i className="fa fa-envelope"></i>
                          </span>
                      </div>
                    </div>
                  </div>
                  <div className="container mb-2">
                    <div className="field">
                      <div className="control">
                          <input className="input" type="text" placeholder="Subject..." value={sendEmailDetails.emailSubject} name="emailSubject" onChange={handleChange} />
                          <sub>(Your email subject)</sub>
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <div className="control" id="editor">
                      <JoditEditor
                        ref={editor}
                        value={htmlEmailContent}
                        config={config}
                        tabIndex={1}
                        onBlur={newContent => setHtmlEmailContent(newContent)} 
                        onChange={newContent => {}}
                      />
                    </div>
                  </div>
                </div> 
            </section>
            <footer className="modal-card-foot is-block-mobile">
                <button className="button is-normal is-info is-outlined" onClick={(e) => {e.preventDefault(); setEmailComposeModalIsVisible(false)}}>Cancel</button>
                <p className="has-text-primary"><sub> (You can change FRONTPAGE values later)</sub></p>
                <button onClick={sendEmail} style={{marginLeft: "auto"}} disabled={!sendEmailDetails.toEmail || !sendEmailDetails.sender} className="button is-normal is-primary" >Send&nbsp;&nbsp;<i class="fa fa-paper-plane"></i></button>
                
            </footer>
            </div>
        </div>
    )
}

export default EmailComposeModal;
