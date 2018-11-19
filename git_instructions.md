1. Install git  
`sudo apt-get install git`

2. Check for name  
`git config --global user.name`

3. Configure your name  
`git config --global user.name "Your name"`

4. Check for mail  
`git config --global user.email`

5. Configure email  
`git config --global user.email "email@example.com"`

6. Create a new directory with name of your choice

7. cd into that directory

8. Run following commands
	- `git init`
	- `git remote add origin  https://gitlab.com/gdadlaney/Data-Exchange-Platform.git`	# "origin" is your remote_name (part of .git/refs/remotes/)
	- `git pull origin master`
	- OR `git clone https://gitlab.com/gdadlaney/Data-Exchange-Platform.git`				# instead of the above 3
	- `git remote -v`																		# lets you check the origin urls
	
9. After changing any file at the end of the day run following commands
	- `git add .`								# Add new/updated files to staging index
	- `git commit -m "message"`				# Always add an informative message
	- `git pull origin master`				# Always pull updates from remote, else remote won't remain stable
	- `git push origin master`

10. Branching
	- `git checkout -b new_branch`		# create a new branch & switch to it
	- `git checkout master`				# switch to any branch
	- `git branch` 						# show all branches in current local repo
	
	- `git checkout master && git merge new_branch`	# merge new_branch with master branch
	- `git branch -d new_branch`			# delete a branch after it has been merged ( -D to remove a branch w/o merging )

### Add individual files to staging/commit
	- `git add file1 [file2 ...]`
	- `git commit [file1 ...] -m "..."`

### Why does git have a staging-index?
	1) Split work into different commits -
		Say you came for a task x, but also found some formatting that could be improved. You could commit the fix in one commit & the formatting in another, to make it easier to review changes later.
	2) Keep adding changes in the staging index, which work well. If a change doesn't work well & you want to discard the changes, you can checkout the file or checkout all files - "git checkout *" to bring them to their previous staging state.

#### If you want to forgo the staging-index
	- `git commit -a`

Read more about pulling, pushing from a remote repo & merge_conflicts:  
https://stackoverflow.com/questions/5601931/best-and-safest-way-to-merge-a-git-branch-into-master

### Other Commands - 
	- `git help <command>` 	OR 		`git help -a`

	Before Staging -
	# The 2 below are used together
	- `git diff`				# show the changes in the files made before adding them to the staging index
	- `git checkout file1`	# undo any changes made after the previous staging of file1

### After Staging -
	- `git ls-files`		# shows the files currently in the staging-index.
	- `git rm file1 file2 ...`