    social_image: trash-social.png

---

    language: en
    description: Fighting the nuissance of OS-specific metadata files on shared network drives
    published: 2021-10-02


# How to avoid littering your network shares with .DS_Store and .Trash-1000 files

Following a big revamp of my homeserver/NAS setup a couple days ago (I know, I still owe this blog a post on that setup) [I was complaining on Twitter](https://twitter.com/slsoftworks/status/1442024283610439682) about how MacOS instantly spewed `.DS_Store` files into every corner of my Samba network share (also called SMB, CIFS or simply "Windows shares").

After a short investigation, I learned about an Apple Support article that can help you disable this (mis)feature. You probably won't find it, though:

![Screenshot of the Apple support page shows a search for the "disable ds_store" query, with all results mentioning the App Store and none being relevant to the actual issue](/sources/img/apple-support-ds_store.png "None of these results are even remotely about .DS_Store files")

As it turns out, the support entry is helpfully named ["Adjust SMB browsing behavior in macOS"](https://support.apple.com/en-us/HT208209). In fact, Apple frames this as a simple performance-optimization:

> *"To speed up SMB file browsing, you can prevent macOS from reading `.DS_Store` files on SMB shares. This makes the Finder use only basic information to immediately display each folder's contents in alphanumeric order."*

You invoke the magical incantation through the terminal:

```sh
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool TRUE
```

Oh and yes, this only works for network drives, not for pendrives or any other removable media.

With that out of the way, the only annoyance that remained are `.Trash-1000` folders scattered about. These are created by Gnome, running on my Ubuntu laptop. They fulfill the same role as Windows' "Recycyle Bin", they store the "deleted" files until you decide to empty the bin, or restore the files.

I felt there was ought to be some sort of mount option that can disable this feature on network mounts, and since this is a Gnome thing, I knew I should be looking around [gvfs](http://manpages.ubuntu.com/manpages/focal/en/man7/gvfs.7.html).

A cursory search lead me to a [decade-old AskUbuntu question -- unanswered](https://askubuntu.com/questions/248944/how-to-disable-trash-for-remote-filesystems-in-nautilus). I know, classic. The question matched perfectly what I was looking for, and I also learned the reason it remained unanswered for so long: the feature did not exist up until last summer!

> *"Since GLib 2.66, the `x-gvfs-notrash` unix mount option can be used to disable `g_file_trash()` support for certain mounts, the `%G_IO_ERROR_NOT_SUPPORTED` error will be returned in that case."*

The above comes straight from the documentation of the relevant function call, [`Gio.File.trash`](https://docs.gtk.org/gio/method.File.trash.html), used to move a file into trash rather than deleting it. Armed with this information, it wasn't hard to track down [the merged issue](https://gitlab.gnome.org/GNOME/gvfs/-/merge_requests/89) for more details. The original contributor [Ondřej Holý even has a short blogpost on the subject](https://ondrej.holych.net/whats-new-in-gvfs-for-gnome-40/).

So I have the same files also shared as an NFS network drive that I mount on Linux via [`fstab`](http://manpages.ubuntu.com/manpages/focal/en/man5/fstab.5.html) automatically on boot. Here's how that looks like in my case:

```clike
...

192.168.0.1:/nfsshare  /mnt/networkdrive  nfs  auto,rw,x-gvfs-notrash  0  0
```

Remember, **this will disable the Trash functionality** for these mounted files. Although at least the Gnome file manager will display a warning and ask for confirmation when permanently deleting files.

You probably already guessed the catch: unfortunately all these workarounds exist *on the client*. This means anytime someone comes along browsing these (writable) shares with a device that doesn't have these tweaks enabled the pesky files are bound to re-appear again.

*Social image photo "Curious Racoon", taken by [davoud](https://www.pentaxforums.com/gallery/photo-curios-racoon-44736/)*
