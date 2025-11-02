Consider using git-trees with AI to have multiple models run in parellel on the same project:
- One writing code, reviewing, refactoring, planning, debugging/testing/validation (a non-LLM can run tests, generate reports, etc.)


Add rules for the AI to keep best coding practices in mind, as well as adher to Strict ESLint rules WHILE coding, before the code needs to be "fixed".




Add the ability to upload a ZIP file (because the repo I need is private). This should also allow the user to upload a project zip file that was downloaded from a prior project.

And I don't want OR... I want to give a starting prompt with the imported project.

Also, even on a public repo import, I get an error:
Import Failed, Failed to fetch



The agent workflow should change based on the complexity of the request (such as generate an image, deep research, report, etc.), wether starting from scratch (greenfield and level of complexity), or importing a project (contuing development; no initial docs, instead analyze the code base and documentation to determine the best course of action in alignment with the user prompt).

The system needs to be dynamic and robust, handling all cases uniquely by determining a logic tree/workflow to follow.

CRITICAL: The system is back to creating a brand new project when trying to import a ZIP archive. It seems to load it in, but nothing shows in the Files menu and the Agent Workflow starts building the documents as if it would with a new project. FIX THIS!



Notes:
Fix and enhance the GitHub import feature with the following changes:

1. **Add ZIP File Upload Support**
   - Add a file input option in the GitHub import dialog that allows users to upload a ZIP file directly
   - This should support two use cases:
     a) Private GitHub repositories that users have manually downloaded as ZIP files
     b) Previously exported TaskWizer projects that users want to re-import
   - The ZIP upload should use the same extraction and file processing logic as the GitHub URL import
   - Update the dialog UI to show both options: "Import from GitHub URL" OR "Upload ZIP File"

2. **Fix the Starting Prompt Flow**
   - Remove the "OR" separator between the main textarea and the import button on the home page
   - Instead, allow users to enter a custom prompt/instruction in the main textarea BEFORE clicking "Import from GitHub"
   - When importing (either via URL or ZIP upload), use the user's entered prompt as the initial message instead of the auto-generated "Enhance and improve this imported project: {repoName}" message
   - If the textarea is empty when importing, then use a sensible default prompt like "Help me work on this project"

3. **Fix the CORS Error for Public Repositories**
   - The current implementation fails with "Import Failed, Failed to fetch" even for public repositories due to CORS restrictions
   - Implement a working solution for public repository imports. Options:
     a) Use GitHub's Contents API to fetch files individually (slower but works without CORS)
     b) Use a CORS proxy for development/testing purposes
     c) Implement the backend proxy solution documented in GITHUB_IMPORT_IMPLEMENTATION.md
   - Choose the simplest approach that actually works in the browser

4. **Testing Requirements**
   - Test ZIP file upload with a manually downloaded GitHub repository
   - Test that the custom prompt from the textarea is properly used as the initial message
   - Verify that public repository imports actually work without CORS errors
   - Ensure the UI clearly shows both import options (URL and ZIP upload)

Also, when exporting code, honor the .gitignore file and exclude the files that match the patterns, etc. like git would do (the extra files can be large, espeically if running the code in the browser and the project has "node_modules".


STILL NO FUCKING CHANGE IS REFLECTED IN THE UI, SO I WILL JUST REPEAT!!!!!!!!!!!!!!!!
I'M GOING TO TRY TO EXPLAIN THIS CALMLY, AND IN PLAIN ENGLISH... WHEN I IMPORT A PROJECT, IT ALLOWS ME TO ADD A MESSAGE YES... BUT WHEN I SUBMIT IT, THE PROJECT IS STARTING FROM SCRATCH. IT FIRST BUILDS OUT THE DOCUMENTATION AND CONTINUES THE NORMAL WORKFLOW AS IF IT IS A BRAND NEW PROJECT.

AND NONE OF THE FILES I "IMPORTED" EXIST IN THE FILES MENU OR ARTIFACTS... SO BASICALLY THE FEATURE DOES NOT FUNCTIONALLY WORK AT FUCKING ALL!!!!!!!!!!!!!!!!!!!! NOT ONE IOTA... THIS IS STUPID AND I DO NOT UNDERSTAND THE DISCONNECT.... FIX THE PROBLEM PLEASE!!!!!!!!!!!!!!!!!!

HOW ABOUT YOU ACTUALLY FIX THE ISSUE AND VALIDATE THAT IT'S FIXED?




The GitHub project import feature is completely broken and needs to be fixed with proper validation. Here's the exact problem:

**Current Broken Behavior:**
1. I import a ZIP file containing project files
2. I optionally add a message/query in the import dialog
3. I click "Import Project" or submit
4. The system IGNORES all imported files (ALSO, THE IMPORT IS NEAR INSTANT, SO IT SEEMS LIKELY THE IMPORT FAILED AND REALLY DIDN'T DO ANYTHING AT ALL).
5. The system starts generating a brand new project from scratch (creates documentation, follows normal scaffolding workflow)
6. NONE of the imported files appear in the Files menu
7. NONE of the imported files appear in the Artifacts panel
8. The import feature is completely non-functional

**Required Fix:**
1. Conduct a comprehensive end-to-end audit of the entire import flow:
   - Frontend: ZIP file upload, extraction, and file handling
   - Frontend: How imported files are stored in state (codeGenStore, React state, etc.)
   - Frontend: How the import submission triggers the chat/agent flow
   - Backend: How the agent receives and processes imported files
   - Backend: How the agent distinguishes between "new project" vs "imported project"
   - State persistence: How imported files are saved to IndexedDB/database
   - UI rendering: How the Files menu and Artifacts panel display files

2. Identify the exact point where imported files are being lost or ignored

3. Fix the bug so that:
   - Imported files immediately appear in the Files menu after import
   - Imported files appear in the Artifacts panel
   - Imported files persist after page refresh
   - The system does NOT start blueprint/scaffolding generation for imported projects
   - The system recognizes this is an imported project, not a new project request

4. Validate the fix works by:
   - Building the application (`npm run build`)
   - Starting the preview server on a fresh port (e.g., `npm run preview -- --port 9050`)
   - Creating a test ZIP file with 3-4 sample files (HTML, JS, CSS)
   - Actually importing the ZIP file through the UI
   - Verifying files appear in Files menu
   - Verifying files appear in Artifacts
   - Verifying NO blueprint generation starts
   - Refreshing the page and confirming files still exist
   - Taking screenshots as proof the fix works

5. Do not claim the issue is fixed without actually testing it in the running application

**Critical Requirements:**
- Do a REAL audit of the code, not assumptions
- Trace the entire data flow from ZIP upload to UI rendering
- Test the actual fix in the running application
- Provide evidence (screenshots, console logs) that it works



Prompt:
Work on and enhance this app project.
This is your source code, documentation and planning. Use all resources at your disposal to self-improve and enhance the system.
First start by auditing the code base, documentation, and develop a plan of action to systematically improve the code, implement features, fix bugs, UI/UX issues and so on.
Each feature you implement and enhance will improve your core system and therefor assist in self-improving YOU (the AI code base and scaffolding system) though each iteration, so focus on the most important aspects to give yourself the capabilities to improve faster (what this is, and the exact plan, that's for you to decide).

## Execution Requirements

- **Work Autonomously**: Make all technical decisions without asking for user input
- **Choose Simplicity**: Select the easiest, most maintainable solution when multiple options exist (if the solution solves for all constraints)
- **Use Established Libraries**: Prefer well-maintained libraries over custom implementations
- **Verify Everything**: Test each fix in the running browser
- **Check Console**: Ensure zero errors in browser DevTools console
- **Complete All Tasks**: Do not stop until all priorities are 100% complete and verified


It seems to be working for simple archives, but not larger projects like /home/mkinney/Repos/app-builder.zip which is ~35mb and 95mb uncompressed) and just fails to load, and the project starts from scratch. Please fix this.

Please keep in mind, the behavior should be different from a new project vs continuing one and largely depend on the user request to determine the logic tree.

It would also probably be good to keep files in a given project (including config and context, etc) to be able to continue a project. Maybe review documents and the code when importing, etc.

Add the logic, impliment all functionality, test and validate that all this works fully.
