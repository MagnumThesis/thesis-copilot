# Thesis Copilot
This app helps the academics in creating their thesis proposals
It is similar to any other "yet another ai chatbot' but we are building it for a more specific usecase
We want to create a workflow that works for both the user and the LLM 
As such we split up the tasks in different key areas:
- Generic chatbot that helps the user come up and solidify their proposal
- Idealist tool; summarizes the definitions that the user wants to use for the proposal
- Builder tool; creates to document proposal using markdown, which the LLM also uses natively to construct their responses
- Proofreader tool; analyzes the proposal document and markdown the key areas that might need a little attention, clarification or may some rephrasing
- Referencer tool; will keep track of the references and occasionally suggest papers or sources that might help the user with their proposal


# TODO
## Features
- Builder to be integrated with AI
    - Prompt mode
    - Continue generating mode
    - Modify selected content/text mode
    - implement action toolbar the user can choose what mode to use
- Proofreader and Referencer to be implemented
- Proofreader will list area of concerns
    - Same format with idealist tool except here the proofreader will read the proposal and list of idea definitions instead of the chat messages
    - Proof reader just list the concerns, it will not command the AI to do something about it, it will be the users job
        - If the AI commands the AI, it will be an agentic job which is not really the goal of this tool
        - The proof reader will not do actions, it will just list the concerns and the user will manage the concerns themselves
- Referencer will get sources based on what the user prompted, will strictly only use google scholar and IEEE 

## Code Quality Improvement
- Using convex to have tighter context in both the front end and backend especially api calls
