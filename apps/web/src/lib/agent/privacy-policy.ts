import { siteConfig } from "@/lib/site-config";

import type { SitePage } from "./page-content";
import {
  GENERAL_LEGAL_CREDIT,
  bullets,
  item,
  itemWithList,
  link,
  list,
  p,
  section,
  sectionIndex,
  sectionLink,
  strong,
  subheading,
  table,
} from "./page-content";

/**
 * The Privacy Policy, adapted from General Legal's GDPR privacy policy
 * template. Every statement here describes what the code actually does; when
 * the product changes, change this text in the same commit. Its git history is
 * the policy's version history, which the page links to.
 */

const EFFECTIVE_DATE = "October 3, 2026";

const email = link(siteConfig.email, `mailto:${siteConfig.email}`);

/** Applies to every category in the CCPA chart below. */
const GENERAL_PURPOSES =
  "Compliance and protection; Data sharing in the context of corporate events; To create aggregated, de-identified and/or anonymized data";

/** Recipients that every category in the CCPA chart below may reach. */
const GENERAL_RECIPIENTS = "Professional advisors; Authorities and others; Business transferees";

const ANY_DATA = "Any and all data types relevant in the circumstances";

const personalInformationWeCollect = section(
  "Personal information we collect",
  p(
    strong("Information you provide to us."),
    " Personal information you may provide to us through the Service or otherwise includes:",
  ),
  list(
    item(strong("Contact data"), ", such as your name and email address."),
    item(
      strong("Profile data"),
      ", such as the password that you set to establish an online account on the Service (we store only a hash of it, never the password itself), the name shown on your profile, your profile picture, the organizations you belong to and your role in each, and any other information that you add to your account profile.",
    ),
    item(
      strong("Communications data"),
      " based on our exchanges with you, including when you contact us by email.",
    ),
    item(
      strong("Transactional data"),
      ", such as information relating to or needed to complete the subscriptions you start for an organization through the Service, including the plan, its status and billing periods, and the identifiers that Stripe assigns to the subscription and to your customer record.",
    ),
    item(
      strong("Marketing data"),
      ", such as the email address you enter to join the waitlist and, if you are signed in when you join, a link to your account.",
    ),
    item(
      strong("User-generated content and input data"),
      ", such as the names and URL slugs of the organizations you create, the todos you add to them, and other content or information that you generate, transmit, or otherwise make available on the Service, as well as associated metadata. Metadata includes information on when a piece of content was created and last edited and which organization it belongs to.",
    ),
    item(
      strong("Payment data"),
      " needed to complete transactions, including payment card information. Our payment processor, Stripe, collects this data directly on its own checkout page, and it never reaches our servers.",
    ),
    item(
      strong("Other data"),
      " not specifically listed here, which we will use as described in this Privacy Policy or as otherwise disclosed at the time of collection.",
    ),
  ),
  p(
    strong("Third-party sources."),
    " We may combine personal information we receive from you with personal information falling within one of the categories identified above that we obtain from other sources, such as:",
  ),
  list(
    item(
      strong("Third-party services"),
      ", such as GitHub, that you use to log into your Service account. This data may include your username, profile picture and other information associated with your account on that third-party service that is made available to us based on your account settings on that service. When you sign in with GitHub, we receive your GitHub name (or, if you have not set one, your username), email address, profile picture and account ID, and the access token that GitHub issues for the sign-in.",
    ),
    item(
      strong("Service providers"),
      " that provide services on our behalf or help us operate the Service or our business, such as Stripe, which tells us when a subscription starts, changes or ends.",
    ),
  ),
  p(
    strong("Automatic data collection."),
    " We and our service providers may automatically log information about you, your computer or mobile device, and your interaction over time with the Service, our communications and other online services, such as:",
  ),
  list(
    item(
      strong("Device data"),
      ", such as your IP address and your browser's user agent, which identifies your browser type and version and your device's operating system. The Service records both with each signed-in session, and it counts sign-in and other account requests by IP address to limit abuse.",
    ),
  ),
  p(
    "For more information concerning our automatic collection of data, please see the ",
    sectionLink("Tracking & Other Technologies"),
    " section below.",
  ),
  p(
    strong("Data about others."),
    " We offer features that help users invite other people to join their organizations on the Service, and we collect the email addresses of these invitees, with the role they are invited to take, so we can deliver their invitations. Please do not invite someone or share their contact details with us unless you have their permission to do so.",
  ),
);

const trackingAndOtherTechnologies = section(
  "Tracking & Other Technologies",
  p(
    strong("Cookies and other technologies."),
    " Some of our automatic data collection is facilitated by cookies and other technologies. Cookies are small data files that are placed on your computer or mobile device when you visit a website. The Service runs no third-party analytics, advertising or tracking scripts. It uses only first-party cookies, served directly by us, and browser web storage, in the following categories:",
  ),
  list(
    item(
      strong("Essential."),
      " These cookies are necessary to allow the technical operation of the Service, and they are the only cookies the Service sets: a session cookie that keeps you signed in for seven days, renewed while you keep using the Service, and, while you sign in with GitHub, a cookie that protects the sign-in against forgery and expires after five minutes. You can delete or block them in your browser settings, but you will then not be able to sign in.",
    ),
    item(
      strong("Functionality / performance."),
      " These enhance the performance and functionality of the Service. Your light or dark theme choice stays in your browser's local storage (browser web storage, which works much like a cookie) and is never sent to us. Your web browser may provide functionality to clear your browser web storage, after which the Service shows its default theme.",
    ),
    item(
      strong("Analytics."),
      " We do not use analytics cookies or any other analytics technologies.",
    ),
  ),
  p("We do not use advertising or social media cookies."),
  p(
    "For information concerning your choices with respect to the use of tracking technologies, see the ",
    sectionLink("Your choices"),
    " section below.",
  ),
);

const howWeUseYourPersonalInformation = section(
  "How we use your personal information",
  p(
    "We may use your personal information for the following purposes or as otherwise described at the time of collection:",
  ),
  p(strong("Service delivery and operations."), " We may use your personal information to:"),
  bullets(
    "provide the Service;",
    "enable security features of the Service, such as recording the IP address and user agent of each signed-in session and limiting how often sign-in and other account requests can be made;",
    "establish and maintain your user profile on the Service;",
    "facilitate the invitations you send to people you want to join your organizations on the Service;",
    "communicate with you about the Service, including by sending Service-related announcements, updates, security alerts, and support and administrative messages, such as email verification, password-reset and invitation emails; and",
    "provide support for the Service, and respond to your requests, questions and feedback.",
  ),
  p(
    strong("Service personalization,"),
    " which may include using your personal information to remember your selections and preferences as you navigate webpages, such as your light or dark theme.",
  ),
  p(
    strong("Marketing and advertising."),
    " We may use your personal information for the following marketing purpose, and we do not use it for advertising:",
  ),
  list(
    item(
      strong("Direct marketing."),
      " We may send direct marketing communications, such as news about Init, to the email address you gave the waitlist. You may opt out of our marketing communications as described in the Opt-out of communications section below.",
    ),
  ),
  p(strong("Compliance and protection."), " We may use your personal information to:"),
  list(
    item(
      "comply with applicable laws, lawful requests, and legal process, such as to respond to subpoenas, investigations or requests from government authorities;",
    ),
    item(
      "protect our, your or others' rights, privacy, safety or property (including by making and defending legal claims);",
    ),
    item(
      "audit our internal processes for compliance with legal and contractual requirements or our internal policies;",
    ),
    item("enforce the terms and conditions that govern the Service; and"),
    item(
      "prevent, identify, investigate and deter fraudulent, harmful, unauthorized, unethical or illegal activity, including cyberattacks and identity theft.",
    ),
  ),
  p(
    strong("Data sharing in the context of corporate events,"),
    " we may share certain personal information in the context of actual or prospective corporate events – for more information, see ",
    sectionLink("How we share your personal information"),
    ", below.",
  ),
  p(
    strong("To create aggregated, de-identified and/or anonymized data."),
    " We may create aggregated, de-identified and/or anonymized data from your personal information and other individuals whose personal information we collect. We make personal information into de-identified and/or anonymized data by removing information that makes the data identifiable to you and we will not attempt to reidentify any such data. We may use this aggregated, de-identified and/or anonymized data and share it with third parties for our lawful business purposes, including analyzing and improving the Service and promoting our business.",
  ),
  p(
    strong("Further uses,"),
    " in some cases, we may use your personal information for further uses, in which case we will ask for your consent to use your personal information for those further purposes if they are not compatible with the initial purpose for which information was collected.",
  ),
);

const retention = section(
  "Retention",
  p(
    "We generally retain personal information to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for fraud prevention purposes. To determine the appropriate retention period for personal information, we may consider factors such as the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
  ),
  p(
    "When we no longer require the personal information we have collected about you, we may either delete it, anonymize it, or isolate it from further processing.",
  ),
  p("Specifically:"),
  bullets(
    "A signed-in session, with the IP address and user agent it recorded, lasts seven days and is extended while you keep using the Service. Signing out deletes it.",
    "The counters that limit sign-in and other account requests are keyed to an IP address and cover a window of at most one minute, and expired counters are deleted as new requests arrive.",
    "Email verification and password-reset links expire after one hour, and an invitation expires after 48 hours if it is not accepted.",
    "When you replace a profile picture you uploaded, the previous one is deleted from storage, and removing your profile picture deletes it.",
    "Deleting a todo deletes it permanently, and deleting an organization deletes its memberships, invitations and todos.",
    "We keep your account and its content until you delete them or ask us to delete your account, and we keep your waitlist entry until you ask us to remove it.",
    "We never store your payment card details; Stripe holds them.",
  ),
);

const howWeShareYourPersonalInformation = section(
  "How we share your personal information",
  p(
    "We may share your personal information with the following parties (or as otherwise described in this Privacy Policy, in other applicable notices, or at the time of collection). We do not sell your personal information or share it with advertisers.",
  ),
  list(
    item(
      strong("Service providers."),
      " Third parties that provide services on our behalf or help us operate the Service or our business (such as hosting, database hosting, file storage and email delivery). Vercel hosts the Service and stores uploaded profile pictures in Vercel Blob, the Service's data is kept in a hosted Postgres database, and Resend delivers the Service's email, such as verification, password-reset and invitation emails.",
    ),
    item(
      strong("Payment processors."),
      " Any payment card information you use to make a purchase on the Service is collected and processed directly by our payment processor, Stripe. When you start a subscription, we also send Stripe your name, email address and the identifiers of your account and organization so it can set up and manage the subscription. Stripe may use your payment data in accordance with its privacy policy, ",
      link("https://stripe.com/privacy", "https://stripe.com/privacy"),
      ".",
    ),
    item(
      strong("Third parties designated by you."),
      " We may share your personal information with third parties where you have instructed us or provided your consent to do so.",
    ),
    item(
      strong("Linked third-party services."),
      " If you log into the Service with, or otherwise link your Service account to, a third-party service such as GitHub, we may share your personal information with that third-party service. The third party's use of the shared information will be governed by its privacy policy and the settings associated with your account with the third-party service.",
    ),
    item(
      strong("Professional advisors."),
      " Professional advisors, such as lawyers, auditors, bankers and insurers, in the course of the professional services that they render to us.",
    ),
    item(
      strong("Authorities and others."),
      " Law enforcement, government authorities, and private parties, as we believe in good faith to be necessary or appropriate for the Compliance and protection purposes described above.",
    ),
    item(
      strong("Business transferees."),
      " We may disclose personal information in the context of actual or prospective business transactions (e.g., investments in Init, financing of Init, or the sale, transfer or merger of all or part of Init or its assets). For example, we may need to share certain personal information with prospective counterparties and their advisers. We may also disclose your personal information to an acquirer, successor, or assignee of Init as part of any merger, acquisition, sale of assets, or similar transaction, and/or in the event of an insolvency, bankruptcy, or receivership in which personal information is transferred to one or more third parties as one of our business assets.",
    ),
    item(
      strong("Other users and the public."),
      " Your profile and other user-generated content and input data are visible to other users of the Service with whom you share them. Your name, email address, profile picture and role in an organization, and the todos and invitations added to it, are visible to the other members of that organization, and the people you invite see your email address. Profile pictures are stored at public web addresses, so anyone who has a picture's address can view it. This information can be seen, collected and used by others, including being cached, copied, screen captured or stored elsewhere by others, and we are not responsible for any such use of this information.",
    ),
  ),
);

const yourChoices = section(
  "Your choices",
  p(
    "In this section, we describe the rights and choices available to all users. Users who are located in certain U.S. states and Europe can find additional information about their rights below.",
  ),
  list(
    item(
      strong("Access or update your information."),
      " If you have registered for an account with us through the Service, you may review and update certain account information, such as your name and profile picture, by logging into the account. To change the email address on your account, contact us.",
    ),
    item(
      strong("Opt-out of communications."),
      " You may opt out of marketing-related emails by contacting us to have your email address removed from the waitlist. Please note that if you choose to opt out of marketing-related emails, you may continue to receive service-related and other non-marketing emails.",
    ),
    item(
      strong("Cookies and other technologies."),
      " Most browsers let you remove or reject cookies. To do this, follow the instructions in your browser settings. Many browsers accept cookies by default until you change your settings. Please note that if you set your browser to disable cookies, you will not be able to sign in to the Service, because its only cookies are the ones that sign you in and keep you signed in. Your browser may also let you clear its web storage, which resets your theme choice.",
    ),
    item(
      strong("Do Not Track."),
      ' Some Internet browsers may be configured to send "Do Not Track" signals to the online services that you visit. We currently do not respond to "Do Not Track" signals, because the Service does not track you across other websites.',
    ),
    item(
      strong("Declining to provide information."),
      " We need to collect personal information to provide certain services. If you do not provide the information we identify as required or mandatory, we may not be able to provide those services.",
    ),
    item(
      strong("Linked third-party platforms."),
      " If you choose to connect to the Service through your GitHub account or other third-party platform, you may be able to use your settings in your account with that platform to limit the information we receive from it. If you revoke our ability to access information from a third-party platform, that choice will not apply to information that we have already received from that third party.",
    ),
    item(
      strong("Delete your content or close your account."),
      " You can choose to delete certain content through your account: you can delete todos, remove your profile picture, delete an organization you own and leave an organization you belong to. If you wish to request to close your account or to have your waitlist entry removed, please email ",
      email,
      " and it will be deleted.",
    ),
  ),
);

const otherSitesAndServices = section(
  "Other sites and services",
  p(
    "The Service may contain links to websites, mobile applications, and other online services operated by third parties. In addition, our content may be integrated into web pages or other online services that are not associated with us. These links and integrations are not an endorsement of, or representation that we are affiliated with, any third party. We do not control websites, mobile applications or online services operated by third parties, and we are not responsible for their actions. We encourage you to read the privacy policies of the other websites, mobile applications and online services you use.",
  ),
  p(
    "Init's source code is open source, and apps that others build and run with it are operated by them, not by us. This Privacy Policy does not apply to those apps.",
  ),
);

const security = section(
  "Security",
  p(
    "We employ technical, organizational and physical safeguards designed to protect the personal information we collect. However, security risk is inherent in all internet and information technologies and we cannot guarantee the security of your personal information.",
  ),
);

const internationalDataTransfer = section(
  "International data transfer",
  p(
    "We are based in the United States and may use service providers that operate in other countries. Your personal information may be transferred to the United States or other locations where privacy laws may not be as protective as those in your state, province, or country.",
  ),
  p(
    "Users in Europe should read the important information provided below about transfer of personal information outside of Europe.",
  ),
);

const children = section(
  "Children",
  p(
    "The Service is not intended for use by anyone under 18 years of age. If you are a parent or guardian of a child from whom you believe we have collected personal information in a manner prohibited by law, please contact us. If we learn that we have collected personal information through the Service from a child without the consent of the child's parent or guardian as required by law, we will comply with applicable legal requirements to delete the information.",
  ),
);

const changesToThisPrivacyPolicy = section(
  "Changes to this Privacy Policy",
  p(
    "We reserve the right to modify this Privacy Policy at any time. If we make material changes to this Privacy Policy, we will notify you by updating the date of this Privacy Policy and posting it on the Service or other appropriate means. Any modifications to this Privacy Policy will be effective upon our posting the modified version (or as otherwise indicated at the time of posting). In all cases, your use of the Service after the effective date of any modified Privacy Policy indicates your acknowledging that the modified Privacy Policy applies to your interactions with the Service and our business.",
  ),
);

const howToContactUs = section(
  "How to contact us",
  p(
    "If you have questions about our practices or if you would like to exercise any privacy related right that may be available to you, please contact us via one of the methods listed below.",
  ),
  list(item(strong("Email"), ": ", email)),
  p(
    "For questions about Init's code that involve no personal information, you can also open an issue at ",
    link(`${siteConfig.repository}/issues`, `${siteConfig.repository}/issues`),
    ". Issues are public, so please do not use them to make privacy requests.",
  ),
);

const statePrivacyRightsNotice = section(
  "State privacy rights notice",
  p(
    'Except as otherwise provided, this section applies to residents of U.S. states to the extent they have privacy laws applicable to us that grant their residents the rights described below (collectively the "',
    strong("State Privacy Laws"),
    '").',
  ),
  p(
    "This section describes how we collect, use, and share Personal Information of residents of these states and the rights these users may have with respect to their Personal Information. Please note that not all rights listed below may be afforded to all users and that if you are not a resident of one of these states listed above, you may not be able to exercise these rights. In addition, ",
    strong(
      "we may not be able to process your request if you do not provide us with sufficient detail to allow us to confirm your identity or understand and respond to it. To confirm your identity, we will ask you to send your request from, or confirm it from, the email address associated with your account or your waitlist entry.",
    ),
  ),
  p(
    'For purposes of this section, the term "',
    strong("Personal Information"),
    '" has the meaning given to "personal data", "personal information" or other similar terms and "',
    strong("Sensitive Personal Information"),
    '" has the meaning given to "sensitive personal information," "sensitive data", or other similar terms in the State Privacy Laws, except that in neither case does such term include information exempted from the scope of the State Privacy Laws.',
  ),
  p(
    strong("Your privacy rights."),
    " The State Privacy Laws may provide residents with some or all of the rights listed below. However, these rights are not absolute and some State Privacy Laws do not provide these rights to their residents. Therefore, we may decline your request in certain cases as permitted by law.",
  ),
  list(
    itemWithList(
      [
        strong("Information."),
        " You can request the following information about how we have collected and used your Personal Information:",
      ],
      [
        item("The categories of Personal Information that we have collected."),
        item("The categories of sources from which we collected Personal Information."),
        item(
          "The business or commercial purpose for collecting and/or selling Personal Information.",
        ),
        item("The categories of third parties with which we share Personal Information."),
        item(
          "The categories of Personal Information that we sold or disclosed for a business purpose.",
        ),
        item(
          "The categories of third parties to whom the Personal Information was sold or disclosed for a business purpose.",
        ),
      ],
    ),
    item(
      strong("Access."),
      " You can request a copy of the Personal Information that we have collected about you.",
    ),
    item(strong("Appeal."), " You can appeal our denial of any request validly submitted."),
    item(
      strong("Correction."),
      " You can ask us to correct inaccurate Personal Information that we have collected about you.",
    ),
    item(
      strong("Deletion."),
      " You can ask us to delete the Personal Information that we have collected from you.",
    ),
    itemWithList(
      [strong("Opt-out.")],
      [
        item(
          strong("Opt-out of certain processing for targeted advertising purposes."),
          " We do not process your personal information for targeted advertising purposes.",
        ),
        item(
          strong("Opt-out of or appeal profiling/automated decision making."),
          " We do not use your Personal Information to engage in profiling or to perform automated decision-making that results in significant financial impacts, significant impacts on housing, education, employment, health care, or criminal justice, or similarly significant impacts.",
        ),
        item(
          strong("Opt-out of other sales of personal data."),
          " We do not sell your Personal Information within the meaning of State Privacy Laws.",
        ),
      ],
    ),
    item(
      strong("Consumers under 16."),
      " We do not have actual knowledge that we collect, sell or share the personal information of consumers under 16 years of age.",
    ),
    item(
      strong("Sensitive Personal Information."),
      " While we process certain categories of Sensitive Personal Information as described in this Privacy Policy, such as the login credentials for your account, we do not process Sensitive Personal Information for the purpose of inferring characteristics about consumers under the CCPA.",
    ),
    item(
      strong("Nondiscrimination."),
      " You are entitled to exercise the rights described above free from discrimination as prohibited by the State Privacy Laws.",
    ),
  ),
  p(
    strong(
      'Exercising your right to opt-out of the "sale" or "sharing" of your Personal Information.',
    ),
    ' We do not sell your Personal Information or "share" it for cross-context behavioral advertising, as the State Privacy Laws define those terms, so there is nothing to opt out of. If that ever changes, we will update this Privacy Policy first, offer a way to opt out, and honor Global Privacy Control ("GPC") signals as valid opt-out requests, as required by applicable law.',
  ),
  p(
    strong("Exercising other state privacy rights."),
    " You may submit requests to exercise any of the other state privacy rights listed above via email to ",
    email,
    ".",
  ),
  p(
    strong("Verification of Identity; Authorized agents."),
    " We may need to verify your identity in order to process your information, access, appeal, correction, or deletion requests and reserve the right to confirm your residency. To verify your identity, we may require government identification, a declaration under penalty of perjury, or other information, where permitted by law.",
  ),
  p(
    "Under some State Privacy Laws, you may enable an authorized agent to make a request on your behalf. However, we may need to verify your authorized agent's identity and authority to act on your behalf. We may require a copy of a valid power of attorney given to your authorized agent pursuant to applicable law. If you have not provided your agent with such a power of attorney, we may ask you to take additional steps permitted by law to verify that your request is authorized, such as by providing your agent with written and signed permission to exercise your State Privacy Laws rights on your behalf, the information we request to verify your identity, and confirmation that you have given the authorized agent permission to submit the request.",
  ),
  p(
    strong("Information practices."),
    " The following describes our practices currently and during the past 12 months:",
  ),
  list(
    item(
      strong("Sources and purposes."),
      " We collect all categories of personal information from the sources and use them for the business/commercial purposes described above in the Privacy Policy.",
    ),
    item(
      strong("Retention."),
      " The criteria for deciding how long to retain personal information is generally based on whether such period is sufficient to fulfill the purposes for which we collected it as described in this notice, including complying with our legal obligations.",
    ),
    item(
      strong("Deidentification."),
      " We do not attempt to reidentify deidentified information derived from personal information, except for the purpose of testing whether our deidentification processes comply with applicable law.",
    ),
  ),
  p(
    strong("Personal information that we collect, use and disclose."),
    ' We have summarized the Personal Information we collect, the purposes for which we collect it and the third parties to whom we may disclose it by reference below to both the categories defined in the "',
    sectionLink("Personal information we collect"),
    '" section of this Privacy Policy above and the categories of Personal Information specified in the CCPA (Cal. Civ. Code §1798.140). This chart describes our practices currently and during the 12 months preceding the effective date of this Privacy Policy. Information you voluntarily provide to us, such as in free-form webforms, may contain other categories of personal information not described below.',
  ),
  table(
    "Personal information we collect, use and disclose",
    [
      'Personal Information ("PI") we collect',
      "CCPA statutory category",
      "Purposes",
      'Categories of third parties to whom we "disclose" PI for a business purpose',
      'Categories of third parties to whom we "sell" or "share" PI',
    ],
    [
      [
        "Contact data",
        "Identifiers; California Customer Records",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Payment processors; Other users and the public; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Profile data",
        "Identifiers; California Customer Records; Audio, electronic, visual or similar information (your profile picture); Sensitive personal information (your account login credentials)",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Other users and the public; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Communications data",
        "Identifiers; California Customer Records",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Transactional data",
        "Identifiers; Commercial information",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Payment processors; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Marketing data",
        "Identifiers",
        `Service delivery and operations; Direct marketing; ${GENERAL_PURPOSES}`,
        `Service providers; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "User-generated content and input data",
        "Identifiers, and any other category of personal information that you include in your content",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Other users and the public; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Payment data",
        "California Customer Records; Commercial information; Sensitive personal information (your payment card details)",
        "Service delivery and operations; Compliance and protection",
        "Payment processors (Stripe collects this data directly)",
        "None",
      ],
      [
        "Data from third-party services you use to log in, such as GitHub",
        "Identifiers; California Customer Records; Sensitive personal information (the access token GitHub issues for your sign-in)",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Linked third-party services; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Device data",
        "Identifiers; Internet or other electronic network activity information",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
      [
        "Data about others (invitees' email addresses)",
        "Identifiers",
        `Service delivery and operations; ${GENERAL_PURPOSES}`,
        `Service providers; Other users and the public; ${GENERAL_RECIPIENTS}`,
        "None",
      ],
    ],
  ),
  p(strong("Additional information for California residents.")),
  p(
    strong("Shine the light law."),
    " Under California's Shine the Light law (California Civil Code Section 1798.83), California residents may ask companies with whom they have formed a business relationship primarily for personal, family or household purposes to provide the names of third parties to which they have disclosed certain personal information (as defined under the Shine the Light law) during the preceding calendar year for their own direct marketing purposes, and the categories of personal information disclosed. We do not disclose personal information to third parties for their own direct marketing purposes. You may send us requests for this information to ",
    email,
    '. In your request, you must include the statement "Shine the Light Request," and provide your first and last name and mailing address and certify that you are a California resident. We reserve the right to require additional information to confirm your identity and California residency. Please note that we will not accept requests via telephone, mail, or facsimile, and we are not responsible for notices that are not labeled or sent properly, or that do not have complete information.',
  ),
  p(
    strong("Additional information for Nevada residents."),
    " Nevada residents have the right to opt-out of the sale of certain personal information for monetary consideration. While we do not currently engage in such sales, if you are a Nevada resident and would like to make a request to opt out of any potential future sales, please email ",
    email,
    ".",
  ),
  p(
    strong("Contact Us."),
    " If you have questions or concerns about our privacy policies or information practices, please contact us using the contact details set forth in the ",
    sectionLink("How to contact us"),
    " section above.",
  ),
);

const noticeToEuropeanUsers = section(
  "Notice to European users",
  subheading("General"),
  p(
    strong("Where this Notice to European users applies."),
    ' The information provided in this "Notice to European users" section applies only to individuals in the United Kingdom and the European Economic Area (i.e., "Europe" as defined at the top of this Privacy Policy).',
  ),
  p(
    strong("Personal information."),
    ' References to "personal information" in this Privacy Policy should be understood to include a reference to "personal data" (as defined in the GDPR) – i.e., information about individuals from which they are either directly identified or can be identified.',
  ),
  p(
    strong("Controller."),
    " Kaiyu Hsu, who provides Init, is the controller in respect of the processing of your personal information covered by this Privacy Policy for purposes of European data protection legislation (i.e., the EU GDPR and the so-called 'UK GDPR' (as and where applicable, the \"GDPR\")). See the 'How to contact us' section above for our contact details.",
  ),
  subheading("Our legal bases for processing"),
  p(
    'In respect of each of the purposes for which we use your personal information, the GDPR requires us to ensure that we have a "legal basis" for that use.',
  ),
  p(
    "Our legal bases for processing your personal information described in this Privacy Policy are listed below.",
  ),
  bullets(
    'Where we need to perform a contract we are about to enter into or have entered into with you ("Contractual Necessity").',
    'Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests ("Legitimate Interests"). More detail about the specific legitimate interests pursued in respect of each Purpose we use your personal information for is set out in the table below.',
    'Where we need to comply with a legal or regulatory obligation ("Compliance with Law").',
    'Where we have your specific consent to carry out the processing for the Purpose in question ("Consent").',
  ),
  p(
    "We have set out below, in a table format, the legal bases we rely on in respect of the relevant Purposes for which we use your personal information – for more information on these Purposes and the data types involved, see '",
    sectionLink("How we use your personal information"),
    "'.",
  ),
  table(
    "Our legal bases for processing",
    ["Purpose", "Categories of personal information involved", "Legal basis"],
    [
      [
        "Service delivery and operations",
        "Contact data; Profile data; Communications data; Transactional data; User-generated content and input data; Payment data; Data from third-party services you use to log in; Device data; Data about others",
        "Contractual Necessity.",
      ],
      [
        "Security",
        "Contact data; Device data",
        "Compliance with Law. Legitimate Interests. We have a legitimate interest in ensuring the ongoing security and proper operation of our Service and associated IT services, systems, and networks.",
      ],
      [
        "Service personalization",
        "Your theme choice, which stays in your browser",
        "Legitimate Interests. We have a legitimate interest in providing you with a good service, which is personalised to you and that remembers your selections and preferences.",
      ],
      [
        "Direct marketing",
        "Marketing data",
        "Legitimate Interests. We have a legitimate interest in promoting our operations and goals as an organisation and sending marketing communications for that purpose. Consent, in circumstances or in jurisdictions where consent is required under applicable data protection laws to the sending of any given marketing communications.",
      ],
      [
        "Compliance and protection",
        ANY_DATA,
        "Compliance with Law. Legitimate Interests. Where Compliance with Law is not applicable, we and any relevant third parties have a legitimate interest in participating in, supporting, and following legal process and requests, including through co-operation with authorities. We and any relevant third parties may also have a legitimate interest of ensuring the protection, maintenance, and enforcement of our and their rights, property, and/or safety.",
      ],
      [
        "Data sharing in the context of corporate events",
        ANY_DATA,
        "Legitimate Interests. We and any relevant third parties have a legitimate interest in providing information to relevant third parties who are involved in an actual or prospective corporate event (including to enable them to investigate – and, where relevant, to continue to operate – all or relevant part(s) of our operations). However, we would always look to take steps to minimize the amount and sensitivity of any personal information shared in these contexts where possible and appropriate.",
      ],
      [
        "To create aggregated, de-identified and/or anonymized data",
        ANY_DATA,
        "Legitimate Interests. We have legitimate interest, and believe it is also in your interests, that we are able to take steps to ensure that our Service operates as intended.",
      ],
      [
        "Further uses",
        ANY_DATA,
        "The original legal basis relied upon, if the relevant further use is compatible with the initial purpose for which the Personal Information was collected. Consent, if the relevant further use is not compatible with the initial purpose for which the personal information was collected.",
      ],
    ],
  ),
  subheading("Retention"),
  p(
    "We retain personal information for as long as necessary to fulfil the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for Compliance and protection purposes.",
  ),
  p(
    "To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
  ),
  p(
    "When we no longer require the personal information we have collected about you, we will either delete or anonymize it or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible. If we anonymize your personal information (so that it can no longer be associated with you), we may use this information indefinitely without further notice to you.",
  ),
  subheading("Other info"),
  p(
    strong("No sensitive personal information."),
    " We ask that you not provide us with any sensitive personal information (e.g., social security numbers, information related to racial or ethnic origin, political opinions, religion or other beliefs, health, biometrics or genetic characteristics, criminal background or trade union membership) on or through the Service, or otherwise to us. If you provide any sensitive personal information to us when you use the Service, you must consent to our processing and use of such sensitive personal information in accordance with this Privacy Policy. If you do not consent to our processing and use of such sensitive personal information, you must not submit such sensitive personal information through the Service.",
  ),
  p(
    strong("No Automated Decision-Making and Profiling."),
    " As part of the Service, we do not engage in automated decision-making and/or profiling, which produces legal or similarly significant effects.",
  ),
  subheading("Your rights"),
  p(
    strong("General."),
    " European data protection laws give you certain rights regarding your personal information. If you are located in Europe, you may ask us to take the following actions in relation to your personal information that we hold:",
  ),
  list(
    item(
      strong("Access."),
      " Provide you with information about our processing of your personal information and give you access to your personal information.",
    ),
    item(strong("Correct."), " Update or correct inaccuracies in your personal information."),
    item(
      strong("Delete."),
      " Delete your personal information where there is no good reason for us continuing to process it – you also have the right to ask us to delete or remove your personal information where you have exercised your right to object to processing (see below).",
    ),
    item(
      strong("Transfer."),
      " Transfer a machine-readable copy of your personal information to you or a third party of your choice.",
    ),
    item(
      strong("Restrict."),
      " Restrict the processing of your personal information, for example if you want us to establish its accuracy or the reason for processing it.",
    ),
    item(
      strong("Object."),
      " Object to our processing of your personal information where we are relying on Legitimate Interests – you also have the right to object where we are processing your personal information for direct marketing purposes.",
    ),
    item(
      strong("Withdraw Consent."),
      " When we use your personal information based on your consent, you have the right to withdraw that consent at any time.",
    ),
  ),
  p(
    strong("Exercising These Rights."),
    " You may submit these requests by email to ",
    email,
    ". We may request specific information from you to help us confirm your identity and process your request. Whether or not we are required to fulfill any request you make will depend on a number of factors (e.g., why and how we are processing your personal information), if we reject any request you may make (whether in whole or in part) we will let you know our grounds for doing so at the time, subject to any legal restrictions.",
  ),
  p(
    strong("Your Right to Lodge a Complaint with your Supervisory Authority."),
    " In addition to your rights outlined above, if you are not satisfied with our response to a request you make, or how we process your personal information, you can make a complaint to the data protection regulator in your habitual place of residence.",
  ),
  list(
    item(
      "For users in the European Economic Area – the contact information for the data protection regulator in your place of residence can be found here: ",
      link(
        "https://www.edpb.europa.eu/about-edpb/our-members_en",
        "https://www.edpb.europa.eu/about-edpb/our-members_en",
      ),
    ),
    item(
      "For users in the UK – the contact information for the UK data protection regulator is below: The Information Commissioner's Office, Water Lane, Wycliffe House, Wilmslow – Cheshire SK9 5AF, Tel. +44 303 123 1113, Website: ",
      link("https://ico.org.uk/make-a-complaint/", "https://ico.org.uk/make-a-complaint/"),
    ),
  ),
  subheading("Data Processing outside Europe"),
  p(
    "We are based in the U.S. and many of our service providers, advisers or other recipients of data are also based in the U.S. This means that, if you use the Service, your personal information will necessarily be accessed and processed in the U.S. It may also be provided to recipients in other countries outside Europe.",
  ),
  p(
    "It is important to note that the U.S. is not the subject of a general 'adequacy decision' under the GDPR – the EU-U.S. Data Privacy Framework and its UK Extension cover only organizations certified under them, and we are not certified. Basically, this means that the U.S. legal regime is not considered by relevant European bodies to provide an adequate level of protection for personal information transferred to us, which is equivalent to that provided by relevant European laws.",
  ),
  p(
    "Where we share your personal information with third parties who are based outside Europe, we try to ensure a similar degree of protection is afforded to it by making sure one of the following mechanisms is implemented:",
  ),
  list(
    item(
      strong("Transfers to territories with an adequacy decision."),
      " We may transfer your personal information to countries or territories whose laws have been deemed to provide an adequate level of protection for personal information by the European Commission or UK Government (as and where applicable) (from time to time).",
    ),
    itemWithList(
      [
        strong("Transfers to territories without an adequacy decision."),
        " We may transfer your personal information to countries or territories whose laws have not been deemed to provide such an adequate level of protection (e.g., the U.S., see above). However, in these cases:",
      ],
      [
        item(
          "we may use specific appropriate safeguards, which are designed to give personal information effectively the same protection it has in Europe – for example, standard-form contracts approved by relevant authorities for this purpose; or",
        ),
        item(
          "in limited circumstances, we may rely on an exception, or 'derogation', which permits us to transfer your personal information to such country despite the absence of an 'adequacy decision' or 'appropriate safeguards' – for example, reliance on your explicit consent to that transfer.",
        ),
      ],
    ),
  ),
  p(
    "You may contact us if you want further information on the specific mechanism used by us when transferring your personal information out of Europe. You may have the right to receive a copy of the appropriate safeguards under which your personal information is transferred by contacting us at ",
    email,
    ".",
  ),
);

const sections = [
  personalInformationWeCollect,
  trackingAndOtherTechnologies,
  howWeUseYourPersonalInformation,
  retention,
  howWeShareYourPersonalInformation,
  yourChoices,
  otherSitesAndServices,
  security,
  internationalDataTransfer,
  children,
  changesToThisPrivacyPolicy,
  howToContactUs,
  statePrivacyRightsNotice,
  noticeToEuropeanUsers,
];

const printableUrl = `${siteConfig.url}/md/privacy`;

export const privacy: SitePage = {
  description:
    "How Init collects, uses and shares personal information, and the rights and choices you have.",
  footnote: GENERAL_LEGAL_CREDIT,
  path: "/privacy",
  preamble: [
    p(`Effective as of ${EFFECTIVE_DATE}.`),
    p(
      "To view previous versions of this Privacy Policy, see its ",
      link(
        "history on GitHub",
        `${siteConfig.repository}/commits/main/apps/web/src/lib/agent/privacy-policy.ts`,
      ),
      ".",
    ),
    p(
      strong("California Notice at Collection/State Privacy Rights Notice"),
      ": See the ",
      sectionLink("State privacy rights notice"),
      " section below for important information about your rights under applicable state privacy laws.",
    ),
    p(
      'Kaiyu Hsu ("',
      strong("Init"),
      '," "',
      strong("we"),
      '," "',
      strong("us"),
      '" or "',
      strong("our"),
      '") provides Init, an open-source starter kit for building TypeScript products. This Privacy Policy describes how Init processes personal information that we collect through our digital or online properties or services that link to this Privacy Policy (including, as applicable, our website at init.kyh.io, with its documentation, its live demo app and the API it serves) and the other activities described in this Privacy Policy (collectively, the "',
      strong("Service"),
      '").',
    ),
    p(
      strong("Notice to European users"),
      ": Please see the ",
      sectionLink("Notice to European users"),
      ' section below for additional information for individuals located in the European Economic Area or United Kingdom (which we refer to as "Europe", and "European" should be understood accordingly).',
    ),
    p(
      "You can download a printable copy of this Privacy Policy as plain text at ",
      link(printableUrl, printableUrl),
      ".",
    ),
    p(strong("Index")),
    sectionIndex(sections),
  ],
  sections,
  title: "Privacy Policy",
};
